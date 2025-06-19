import { InjectFlowProducer } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FlowProducer } from 'bullmq';

import {
  ACCOUNTS_JOB_NAME,
  ALL_REPORT_JOB_NAME,
  FS_JOB_NAME,
  REPORTS_QUEUE_NAME,
  YEARLY_JOB_NAME,
} from 'src/jobs/reports/constants';

@Injectable()
export class ReportsService {
  constructor(
    @InjectFlowProducer(ALL_REPORT_JOB_NAME) private flowProducer: FlowProducer,
  ) {}

  async report(id: string) {
    const flow = await this.flowProducer.getFlow({
      id,
      queueName: REPORTS_QUEUE_NAME,
    });
    if (!flow) {
      throw new NotFoundException('Report not found');
    }

    const children = flow.children;
    if (!children) {
      throw new NotFoundException('Report not found');
    }

    const resPromise = children?.map(async (jobNode) => {
      const { job } = jobNode;
      let startedAt: Date | null = null;
      if (job.processedOn) {
        startedAt = new Date(job.processedOn);
      }

      let finishedAt: Date | null = null;
      if (job.finishedOn) {
        finishedAt = new Date(job.finishedOn);
      }
      let executionTimeMs: number | null = null;
      if (finishedAt && startedAt) {
        executionTimeMs = finishedAt.getTime() - startedAt.getTime();
      }

      return {
        name: job.name,
        state: await job.getState(),
        startedAt: startedAt ? startedAt.toLocaleString('en-US') : null,
        finishedAt: finishedAt ? finishedAt.toLocaleString('en-US') : null,
        executionTime: executionTimeMs
          ? `${(executionTimeMs / 1000).toFixed(2)} seconds`
          : null,
      };
    });

    return Promise.all(resPromise);
  }

  async generateAll() {
    return await this.flowProducer.add({
      name: ALL_REPORT_JOB_NAME,
      queueName: REPORTS_QUEUE_NAME,
      children: [
        {
          name: ACCOUNTS_JOB_NAME,
          queueName: REPORTS_QUEUE_NAME,
          data: {},
        },
        {
          name: YEARLY_JOB_NAME,
          queueName: REPORTS_QUEUE_NAME,
          data: {},
        },
        {
          name: FS_JOB_NAME,
          queueName: REPORTS_QUEUE_NAME,
          data: {},
        },
      ],
    });
  }
}

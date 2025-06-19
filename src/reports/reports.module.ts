import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import {
  ALL_REPORT_JOB_NAME,
  REPORTS_QUEUE_NAME,
} from 'src/jobs/reports/constants';
import { ReportsConsumer } from 'src/jobs/reports/reports.consumer';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REPORTS_QUEUE_NAME,
    }),
    BullModule.registerFlowProducer({ name: ALL_REPORT_JOB_NAME }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsConsumer],
})
export class ReportsModule {}

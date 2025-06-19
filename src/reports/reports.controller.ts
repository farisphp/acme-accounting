import {
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/v1/reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get(':id')
  async report(@Param('id') id: string) {
    const res = await this.reportsService.report(id);
    return res;
  }

  @Post()
  @HttpCode(201)
  async generate() {
    const flow = await this.reportsService.generateAll();

    if (!flow) {
      throw new InternalServerErrorException(`Failed to generate reports`);
    }

    return { id: flow.job.id };
  }
}

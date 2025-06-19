import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DbModule } from './db.module';
import { HealthcheckController } from './healthcheck/healthcheck.controller';
import { ReportsModule } from './reports/reports.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    DbModule,
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    TicketsModule,
    ReportsModule,
  ],
  controllers: [HealthcheckController],
})
export class AppModule {}

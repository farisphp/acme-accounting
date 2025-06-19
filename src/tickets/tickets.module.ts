import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { ticketsProviders } from './tickets.providers';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, ...ticketsProviders],
})
export class TicketsModule {}

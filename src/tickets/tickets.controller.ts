import { Body, Controller, Get, Post } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('api/v1/tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return await this.ticketsService.findAll();
  }

  @Post()
  async create(@Body() newTicketDto: CreateTicketDto) {
    return await this.ticketsService.create(newTicketDto);
  }
}

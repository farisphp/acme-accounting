import { TicketType } from 'db/models/Ticket';
import { IsString, IsInt } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  type: TicketType;

  @IsInt()
  companyId: number;
}

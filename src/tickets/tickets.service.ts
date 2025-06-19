import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Ticket, TicketStatus, TicketType } from 'db/models/Ticket';
import { Company } from 'db/models/Company';
import { User, UserRole } from 'db/models/User';
import {
  TICKETS_REPOSITORY,
  TICKET_CATEGORIES,
  TICKET_USER_ROLE,
} from './constants';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketDto } from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(TICKETS_REPOSITORY)
    private ticketsRepository: typeof Ticket,
  ) {}

  async create(ticket: CreateTicketDto) {
    const { type, companyId } = ticket;
    await this.checkCompany(companyId);

    if (
      [TicketType.registrationAddressChange, TicketType.strikeOff].includes(
        type,
      )
    ) {
      await this.checkDuplicate(ticket);
    }

    const category = TICKET_CATEGORIES[type];
    let userRole = TICKET_USER_ROLE[type];
    let assignees = await User.findAll({
      where: { companyId, role: userRole },
      order: [['createdAt', 'DESC']],
    });

    if (!assignees.length && userRole === UserRole.corporateSecretary) {
      userRole = UserRole.director;
      const directors = await User.findAll({
        where: { companyId, role: userRole },
        order: [['createdAt', 'DESC']],
      });
      assignees = directors;
    }

    if (!assignees.length)
      throw new ConflictException(
        `Cannot find user with role ${userRole} to create a ticket`,
      );

    if (
      [UserRole.corporateSecretary, UserRole.director].includes(userRole) &&
      assignees.length > 1
    )
      throw new ConflictException(
        `Multiple users with role ${userRole}. Cannot create a ticket`,
      );

    const assignee = assignees[0];

    const ticketRes = await Ticket.create({
      companyId,
      assigneeId: assignee.id,
      category,
      type,
      status: TicketStatus.open,
    });

    if (type === TicketType.strikeOff) {
      await this.resolveAllTickets(companyId);
      await ticketRes.reload();
    }

    const ticketDto: TicketDto = {
      id: ticketRes.id,
      type: ticketRes.type,
      assigneeId: ticketRes.assigneeId,
      status: ticketRes.status,
      category: ticketRes.category,
      companyId: ticketRes.companyId,
    };

    return ticketDto;
  }

  findAll() {
    return this.ticketsRepository.findAll({ include: [Company, User] });
  }

  private async checkCompany(companyId: number) {
    const exist = await Company.findOne({
      where: { id: companyId },
    });
    if (!exist) throw new NotFoundException('Company not found');
  }

  private async checkDuplicate(ticket: CreateTicketDto) {
    const exist = await Ticket.findOne({
      where: { type: ticket.type, companyId: ticket.companyId },
    });
    if (exist) throw new ConflictException('Ticket already exists');
  }

  private async resolveAllTickets(companyId: number) {
    const tickets = await this.ticketsRepository.update(
      { status: TicketStatus.resolved },
      { where: { status: TicketStatus.open, companyId } },
    );
    return tickets;
  }
}

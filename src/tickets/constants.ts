import { TicketCategory, TicketType } from 'db/models/Ticket';
import { UserRole } from 'db/models/User';

export const TICKETS_REPOSITORY = 'TICKETS_REPOSITORY';

export const TICKET_CATEGORIES = {
  [TicketType.managementReport]: TicketCategory.accounting,
  [TicketType.registrationAddressChange]: TicketCategory.corporate,
  [TicketType.strikeOff]: TicketCategory.management,
};

export const TICKET_USER_ROLE = {
  [TicketType.managementReport]: UserRole.accountant,
  [TicketType.registrationAddressChange]: UserRole.corporateSecretary,
  [TicketType.strikeOff]: UserRole.director,
};

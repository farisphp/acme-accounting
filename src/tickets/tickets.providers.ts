import { Ticket } from 'db/models/Ticket';
import { TICKETS_REPOSITORY } from './constants';

export const ticketsProviders = [
  {
    provide: TICKETS_REPOSITORY,
    useValue: Ticket,
  },
];

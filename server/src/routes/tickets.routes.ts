import { Router } from 'express';
import { TicketsController } from '../controllers/tickets.controller.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { CreateTicketSchema, ListTicketsQuerySchema, UpdateTicketSchema } from '../models/ticket.schemas.js';

export function ticketsRouter(controller: TicketsController) {
  const router = Router();

  router.get('/', validateQuery(ListTicketsQuerySchema), controller.list);
  router.post('/', validateBody(CreateTicketSchema), controller.create);
  router.get('/:id', controller.getById);
  router.patch('/:id', validateBody(UpdateTicketSchema), controller.update);
  router.delete('/:id', controller.delete);

  return router;
}

import type { Request, Response } from 'express';
import type { CreateTicketInput, ListTicketsQuery, UpdateTicketInput } from '../models/ticket.schemas.js';
import { TicketsService } from '../services/tickets.service.js';

export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  create = (req: Request, res: Response) => {
    const created = this.service.create(req.body as CreateTicketInput);
    return res.status(201).json(created);
  };

  list = (req: Request, res: Response) => {
    const items = this.service.list(req.query as unknown as ListTicketsQuery);
    return res.status(200).json(items);
  };

  getById = (req: Request, res: Response) => {
    const item = this.service.getById(req.params.id);
    return res.status(200).json(item);
  };

  update = (req: Request, res: Response) => {
    const updated = this.service.update(req.params.id, req.body as UpdateTicketInput);
    return res.status(200).json(updated);
  };

  delete = (req: Request, res: Response) => {
    this.service.softDelete(req.params.id);
    return res.status(204).send();
  };
}

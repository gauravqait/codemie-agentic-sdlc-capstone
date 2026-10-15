import express from 'express';
import cors from 'cors';
import { ticketsRouter } from './routes/tickets.routes.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { TicketsRepository } from './repositories/tickets.repo.js';
import { TicketsService } from './services/tickets.service.js';
import { TicketsController } from './controllers/tickets.controller.js';
import { createSeedTickets } from './repositories/seed.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const repo = new TicketsRepository();
  const service = new TicketsService(repo);
  service.seed(createSeedTickets());
  const controller = new TicketsController(service);

  app.get('/health', (_req, res) => res.status(200).json({ ok: true }));
  app.use('/api/tickets', ticketsRouter(controller));

  app.use(errorMiddleware);

  return app;
}

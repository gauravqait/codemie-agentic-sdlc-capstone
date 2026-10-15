import type { Ticket } from '../models/ticket.types.js';

export class TicketsRepository {
  private readonly tickets = new Map<string, Ticket>();

  create(ticket: Ticket): Ticket {
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  getAll(): Ticket[] {
    return Array.from(this.tickets.values());
  }

  findById(id: string): Ticket | undefined {
    return this.tickets.get(id);
  }

  update(id: string, patch: Partial<Ticket>): Ticket | undefined {
    const existing = this.tickets.get(id);
    if (!existing) return undefined;
    const updated: Ticket = { ...existing, ...patch };
    this.tickets.set(id, updated);
    return updated;
  }
}

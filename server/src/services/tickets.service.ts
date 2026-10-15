import type { ListTicketsQuery, CreateTicketInput, UpdateTicketInput } from '../models/ticket.schemas.js';
import type { Ticket } from '../models/ticket.types.js';
import { TicketsRepository } from '../repositories/tickets.repo.js';
import { createId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';
import { InvalidTransitionError, NotFoundError } from '../middleware/error.middleware.js';
import { isValidTransition } from './transitions.js';

function normalizeOptional(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export class TicketsService {
  constructor(private readonly repo: TicketsRepository) {}

  seed(tickets: Ticket[]) {
    for (const t of tickets) this.repo.create(t);
  }

  create(input: CreateTicketInput): Ticket {
    const now = nowIso();
    const ticket: Ticket = {
      id: createId(),
      title: input.title.trim(),
      description: normalizeOptional(input.description),
      status: 'Open',
      priority: input.priority,
      requester: normalizeOptional(input.requester),
      assignee: normalizeOptional(input.assignee),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    return this.repo.create(ticket);
  }

  list(query: ListTicketsQuery): Ticket[] {
    const q = query.q?.trim().toLowerCase();
    const status = query.status;
    const priority = query.priority;

    let items = this.repo
      .getAll()
      .filter((t) => !t.deletedAt)
      .filter((t) => (status ? t.status === status : true))
      .filter((t) => (priority ? t.priority === priority : true));

    if (q && q.length) {
      items = items.filter((t) => {
        const hay = `${t.title} ${t.description ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Default sort: createdAt desc
    const sort = query.sort ?? 'createdAt:desc';
    const [field, dir] = sort.split(':');
    const direction = dir === 'asc' ? 1 : -1;

    const getValue = (t: Ticket): string => {
      if (field === 'updatedAt') return t.updatedAt;
      if (field === 'createdAt') return t.createdAt;
      return t.createdAt;
    };

    items.sort((a, b) => (getValue(a) > getValue(b) ? direction : -direction));

    return items;
  }

  getById(id: string): Ticket {
    const t = this.repo.findById(id);
    if (!t || t.deletedAt) throw new NotFoundError('Ticket not found');
    return t;
  }

  update(id: string, patch: UpdateTicketInput): Ticket {
    const existing = this.repo.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundError('Ticket not found');

    if (patch.status && !isValidTransition(existing.status, patch.status)) {
      throw new InvalidTransitionError(`Cannot transition from ${existing.status} to ${patch.status}`);
    }

    const updated = this.repo.update(id, {
      title: patch.title?.trim() ?? existing.title,
      description: patch.description !== undefined ? normalizeOptional(patch.description) : existing.description,
      status: patch.status ?? existing.status,
      priority: patch.priority ?? existing.priority,
      requester: patch.requester !== undefined ? normalizeOptional(patch.requester) : existing.requester,
      assignee: patch.assignee !== undefined ? normalizeOptional(patch.assignee) : existing.assignee,
      updatedAt: nowIso()
    });

    if (!updated) throw new NotFoundError('Ticket not found');
    return updated;
  }

  softDelete(id: string): void {
    const existing = this.repo.findById(id);
    if (!existing || existing.deletedAt) throw new NotFoundError('Ticket not found');
    this.repo.update(id, { deletedAt: nowIso(), updatedAt: nowIso() });
  }
}

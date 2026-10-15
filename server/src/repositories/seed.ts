import type { Ticket, TicketPriority, TicketStatus } from '../models/ticket.types.js';
import { createId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';

const priorities: TicketPriority[] = ['Low', 'Medium', 'High'];
const statuses: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

export function createSeedTickets(): Ticket[] {
  const base = nowIso();
  const mk = (i: number): Ticket => {
    const createdAt = new Date(Date.parse(base) - i * 3600_000).toISOString();
    const updatedAt = createdAt;
    return {
      id: createId(),
      title: `Sample ticket #${i + 1}`,
      description: `This is a seeded ticket used for demo and testing (index=${i + 1}).`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      requester: `requester${(i % 3) + 1}@example.com`,
      assignee: i % 2 === 0 ? `agent${(i % 2) + 1}@example.com` : undefined,
      createdAt,
      updatedAt,
      deletedAt: null
    };
  };

  return Array.from({ length: 8 }).map((_, i) => mk(i));
}

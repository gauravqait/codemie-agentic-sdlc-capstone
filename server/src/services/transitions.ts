import type { TicketStatus } from '../models/ticket.types.js';

// Conservative, demo-friendly matrix:
// Open -> In Progress | Resolved
// In Progress -> Resolved | Open
// Resolved -> Closed | In Progress
// Closed -> (none)
const allowed: Record<TicketStatus, TicketStatus[]> = {
  Open: ['In Progress', 'Resolved'],
  'In Progress': ['Resolved', 'Open'],
  Resolved: ['Closed', 'In Progress'],
  Closed: []
};

export function getAllowedNextStatuses(from: TicketStatus): TicketStatus[] {
  return allowed[from];
}

export function isValidTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true;
  return allowed[from].includes(to);
}

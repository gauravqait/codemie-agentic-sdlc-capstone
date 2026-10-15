export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High';

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester?: string;
  assignee?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  deletedAt?: string | null; // ISO
}

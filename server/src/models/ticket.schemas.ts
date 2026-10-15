import { z } from 'zod';

export const TicketStatusSchema = z.enum(['Open', 'In Progress', 'Resolved', 'Closed']);
export const TicketPrioritySchema = z.enum(['Low', 'Medium', 'High']);

export const CreateTicketSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be at most 100 characters'),
  description: z.string().trim().max(2000, 'Description must be at most 2000 characters').optional().or(z.literal('')),
  priority: TicketPrioritySchema.default('Medium'),
  requester: z.string().trim().max(100, 'Requester must be at most 100 characters').optional().or(z.literal('')),
  assignee: z.string().trim().max(100, 'Assignee must be at most 100 characters').optional().or(z.literal(''))
});

export const UpdateTicketSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  requester: z.string().trim().max(100).optional(),
  assignee: z.string().trim().max(100).optional()
});

export const ListTicketsQuerySchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  q: z.string().trim().optional(),
  sort: z.string().trim().optional()
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type ListTicketsQuery = z.infer<typeof ListTicketsQuerySchema>;

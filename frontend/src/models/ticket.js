export const TicketStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const TicketPriorities = ['Low', 'Medium', 'High'];

/**
 * @typedef {'Open'|'In Progress'|'Resolved'|'Closed'} TicketStatus
 * @typedef {'Low'|'Medium'|'High'} TicketPriority
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id
 * @property {string} title
 * @property {string=} description
 * @property {TicketStatus} status
 * @property {TicketPriority} priority
 * @property {string=} requester
 * @property {string=} assignee
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null=} deletedAt
 */

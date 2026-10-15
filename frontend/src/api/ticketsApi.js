import { httpJson } from './httpClient';

export function listTickets(query = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.priority) params.set('priority', query.priority);
  if (query.q) params.set('q', query.q);
  if (query.sort) params.set('sort', query.sort);
  const qs = params.toString();
  return httpJson(`/api/tickets${qs ? `?${qs}` : ''}`);
}

export function getTicket(id) {
  return httpJson(`/api/tickets/${id}`);
}

export function createTicket(payload) {
  return httpJson('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTicket(id, patch) {
  return httpJson(`/api/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  });
}

export function deleteTicket(id) {
  return httpJson(`/api/tickets/${id}`, {
    method: 'DELETE'
  });
}

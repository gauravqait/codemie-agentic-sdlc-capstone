import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../api/ticketsApi';
import { ApiError } from '../api/httpClient';
import TicketForm from '../components/TicketForm';

export default function TicketCreatePage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [serverFieldErrors, setServerFieldErrors] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    setServerFieldErrors(null);

    try {
      const created = await createTicket(payload);
      navigate(`/tickets/${created.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setServerFieldErrors(e.fields ?? null);
      } else {
        setError('Failed to create ticket');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2>Create Ticket</h2>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      <TicketForm
        mode="create"
        initialValues={{ priority: 'Medium' }}
        onSubmit={handleSubmit}
        submitting={submitting}
        serverFieldErrors={serverFieldErrors}
      />
    </div>
  );
}

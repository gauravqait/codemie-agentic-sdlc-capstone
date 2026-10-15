import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTicket, updateTicket } from '../api/ticketsApi';
import { ApiError } from '../api/httpClient';
import TicketForm from '../components/TicketForm';

function allowedNext(current) {
  // Keep in sync with server transitions for MVP.
  const map = {
    Open: ['Open', 'In Progress', 'Resolved'],
    'In Progress': ['In Progress', 'Resolved', 'Open'],
    Resolved: ['Resolved', 'Closed', 'In Progress'],
    Closed: ['Closed']
  };
  return map[current] ?? [current];
}

export default function TicketEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [serverFieldErrors, setServerFieldErrors] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getTicket(id)
      .then((t) => {
        if (!active) return;
        setTicket(t);
      })
      .catch((e) => {
        if (!active) return;
        if (e instanceof ApiError && e.status === 404) setError('NOT_FOUND');
        else setError(e?.message ?? 'Failed to load ticket');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const statuses = useMemo(() => (ticket ? allowedNext(ticket.status) : []), [ticket]);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError('');
    setServerFieldErrors(null);

    try {
      const updated = await updateTicket(id, payload);
      navigate(`/tickets/${updated.id}`);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setServerFieldErrors(e.fields ?? null);
      } else {
        setError('Failed to update ticket');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error === 'NOT_FOUND') return <p>Ticket not found.</p>;
  if (error && !ticket) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!ticket) return <p>Ticket not found.</p>;

  return (
    <div>
      <h2>Edit Ticket</h2>
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      <TicketForm
        mode="edit"
        initialValues={ticket}
        allowedStatuses={statuses}
        onSubmit={handleSubmit}
        submitting={submitting}
        serverFieldErrors={serverFieldErrors}
      />
      <p>
        <Link to={`/tickets/${ticket.id}`}>Cancel</Link>
      </p>
    </div>
  );
}

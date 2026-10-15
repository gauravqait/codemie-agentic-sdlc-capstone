import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteTicket, getTicket } from '../api/ticketsApi';
import { ApiError } from '../api/httpClient';
import ConfirmDialog from '../components/ConfirmDialog';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  async function confirmDelete() {
    try {
      await deleteTicket(id);
      navigate('/tickets');
    } catch (e) {
      setError(e?.message ?? 'Failed to delete');
    } finally {
      setConfirmOpen(false);
    }
  }

  if (loading) return <p>Loading…</p>;
  if (error === 'NOT_FOUND') return <p>Ticket not found.</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!ticket) return <p>Ticket not found.</p>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{ticket.title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/tickets/${ticket.id}/edit`}>Edit</Link>
          <button onClick={() => setConfirmOpen(true)}>Delete</button>
        </div>
      </div>

      <p>
        <strong>Status:</strong> {ticket.status}
      </p>
      <p>
        <strong>Priority:</strong> {ticket.priority}
      </p>
      <p>
        <strong>Description:</strong>
        <br />
        {ticket.description || <em>(none)</em>}
      </p>
      <p>
        <strong>Requester:</strong> {ticket.requester || <em>(none)</em>}
      </p>
      <p>
        <strong>Assignee:</strong> {ticket.assignee || <em>(none)</em>}
      </p>
      <p>
        <strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}
      </p>
      <p>
        <strong>Updated:</strong> {new Date(ticket.updatedAt).toLocaleString()}
      </p>

      <p>
        <Link to="/tickets">Back to list</Link>
      </p>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete ticket?"
        message="This will retire the ticket (soft delete)."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

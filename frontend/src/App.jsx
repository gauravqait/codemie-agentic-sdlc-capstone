import { useMemo, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom';

const STATUSES = ['New', 'Open', 'Pending', 'Resolved', 'Closed'];

function createEmptyTicket() {
  return { subject: '', description: '', status: 'New' };
}

function isValidStatus(status) {
  return STATUSES.includes(status);
}

function TicketsListPage({ tickets, onDelete }) {
  return (
    <main>
      <header>
        <h1>Helpdesk Tickets</h1>
      </header>

      <section aria-label="Tickets list">
        {tickets.length === 0 && <p>No tickets yet.</p>}
        {tickets.length > 0 && (
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <div>
                  <strong>
                    <NavLink to={`/tickets/${ticket.id}`}>{ticket.subject}</NavLink>
                  </strong>{' '}
                  <small>({ticket.status})</small>
                  {ticket.description && <p>{ticket.description}</p>}
                </div>
                <div>
                  <NavLink to={`/tickets/${ticket.id}/edit`}>Edit</NavLink>{' '}
                  <button type="button" onClick={() => onDelete(ticket)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function TicketCreatePage({ onCreate }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => createEmptyTicket());
  const [error, setError] = useState('');

  const change = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const subject = form.subject.trim();
    if (!subject) return setError('Subject is required.');
    if (!isValidStatus(form.status)) return setError('Invalid status.');
    const description = form.description?.trim?.() ?? '';
    const created = onCreate({ ...form, subject, description });
    navigate(`/tickets/${created.id}`);
  }

  return (
    <main>
      <h1>New Ticket</h1>

      <form onSubmit={submit} aria-label="Ticket form">
        <label>
          Subject
          <input value={form.subject} onChange={change('subject')} />
        </label>

        {error && <p role="alert">{error}</p>}

        <label>
          Description
          <textarea value={form.description} onChange={change('description')} />
        </label>

        <label>
          Status
          <select value={form.status} onChange={change('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div>
          <button type="submit">Create</button>{' '}
          <button type="button" onClick={() => navigate('/tickets')}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

function TicketDetailPage({ tickets, onDelete }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const ticketId = Number(id);

  const ticket = useMemo(() => tickets.find((t) => t.id === ticketId), [tickets, ticketId]);

  if (!Number.isFinite(ticketId)) return <NotFoundPage />;
  if (!ticket) return <NotFoundPage />;

  function remove() {
    if (!window.confirm(`Delete "${ticket.subject}"?`)) return;
    onDelete(ticket);
    navigate('/tickets');
  }

  return (
    <main>
      <h1>Ticket #{ticket.id}</h1>

      <section aria-label="Ticket details">
        <p>
          <strong>Subject:</strong> {ticket.subject}
        </p>
        <p>
          <strong>Status:</strong> {ticket.status}
        </p>
        {ticket.description ? (
          <div>
            <strong>Description:</strong>
            <p>{ticket.description}</p>
          </div>
        ) : (
          <p>
            <strong>Description:</strong> <em>None</em>
          </p>
        )}
      </section>

      <nav aria-label="Ticket actions">
        <NavLink to={`/tickets/${ticket.id}/edit`}>Edit</NavLink>{' '}
        <button type="button" onClick={remove}>
          Delete
        </button>{' '}
        <button type="button" onClick={() => navigate('/tickets')}>
          Back to list
        </button>
      </nav>
    </main>
  );
}

function TicketEditPage({ tickets, onUpdate }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const ticketId = Number(id);

  const ticket = useMemo(() => tickets.find((t) => t.id === ticketId), [tickets, ticketId]);

  const [form, setForm] = useState(() =>
    ticket
      ? { subject: ticket.subject, description: ticket.description ?? '', status: ticket.status }
      : createEmptyTicket(),
  );
  const [error, setError] = useState('');

  if (!Number.isFinite(ticketId)) return <NotFoundPage />;
  if (!ticket) return <NotFoundPage />;

  const change = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    const subject = form.subject.trim();
    if (!subject) return setError('Subject is required.');
    if (!isValidStatus(form.status)) return setError('Invalid status.');
    const description = form.description?.trim?.() ?? '';

    onUpdate(ticketId, { ...form, subject, description });
    navigate(`/tickets/${ticketId}`);
  }

  return (
    <main>
      <h1>Edit Ticket #{ticketId}</h1>

      <form onSubmit={submit} aria-label="Ticket edit form">
        <label>
          Subject
          <input value={form.subject} onChange={change('subject')} />
        </label>

        {error && <p role="alert">{error}</p>}

        <label>
          Description
          <textarea value={form.description} onChange={change('description')} />
        </label>

        <label>
          Status
          <select value={form.status} onChange={change('status')}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div>
          <button type="submit">Save</button>{' '}
          <button type="button" onClick={() => navigate(`/tickets/${ticketId}`)}>
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main>
      <h1>Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <p>
        <NavLink to="/tickets">Go to tickets</NavLink>
      </p>
    </main>
  );
}

function AppShell() {
  const [tickets, setTickets] = useState(() => [
    {
      id: 1,
      subject: 'Cannot log in',
      description: 'User reports invalid password after reset.',
      status: 'Open',
    },
    {
      id: 2,
      subject: 'Printer not working',
      description: 'Office printer shows paper jam error with no jam.',
      status: 'Pending',
    },
  ]);

  function createTicket(data) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : String(Date.now());

    const numericId = Number.isFinite(Number(id)) ? Number(id) : Date.now();

    const ticket = {
      id: numericId,
      subject: data.subject,
      description: data.description ?? '',
      status: isValidStatus(data.status) ? data.status : 'New',
    };

    setTickets((prev) => [ticket, ...prev]);
    return ticket;
  }

  function updateTicket(id, patch) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              status: isValidStatus(patch.status) ? patch.status : t.status,
              subject: (patch.subject ?? t.subject).trim?.() ? patch.subject.trim() : t.subject,
              description: patch.description ?? t.description ?? '',
            }
          : t,
      ),
    );
  }

  function deleteTicket(ticket) {
    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
  }

  const navLinkStyle = ({ isActive }) => ({
    fontWeight: isActive ? 700 : 400,
    textDecoration: 'none',
    marginRight: 12,
  });

  return (
    <>
      <header>
        <nav aria-label="Primary navigation">
          <NavLink to="/tickets" style={navLinkStyle}>
            Tickets
          </NavLink>
          <NavLink to="/tickets/new" style={navLinkStyle}>
            New Ticket
          </NavLink>
        </nav>
        <hr />
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/tickets" replace />} />
        <Route
          path="/tickets"
          element={<TicketsListPage tickets={tickets} onDelete={deleteTicket} />}
        />
        <Route path="/tickets/new" element={<TicketCreatePage onCreate={createTicket} />} />
        <Route
          path="/tickets/:id"
          element={<TicketDetailPage tickets={tickets} onDelete={deleteTicket} />}
        />
        <Route
          path="/tickets/:id/edit"
          element={<TicketEditPage tickets={tickets} onUpdate={updateTicket} />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
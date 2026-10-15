import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listTickets } from '../api/ticketsApi';
import { TicketPriorities, TicketStatuses } from '../models/ticket';

function useDebounced(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function TicketsListPage() {
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [q, setQ] = useState('');
  const debouncedQ = useDebounced(q, 300);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(
    () => ({ status: status || undefined, priority: priority || undefined, q: debouncedQ || undefined }),
    [status, priority, debouncedQ]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listTickets(query)
      .then((data) => {
        if (!active) return;
        setTickets(data);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message ?? 'Failed to load tickets');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Tickets</h2>
        <Link to="/tickets/new">Create Ticket</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {TicketStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="">All</option>
            {TicketPriorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label style={{ flex: '1 1 240px' }}>
          Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description" />
        </label>
      </div>

      {loading ? <p>Loading…</p> : null}
      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      {!loading && !error && tickets.length === 0 ? <p>No tickets found.</p> : null}

      {!loading && !error && tickets.length ? (
        <table border="1" cellPadding="8" style={{ marginTop: 12, borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: 'monospace' }}>{t.id}</td>
                <td>
                  <Link to={`/tickets/${t.id}`}>{t.title}</Link>
                </td>
                <td>{t.status}</td>
                <td>{t.priority}</td>
                <td>{new Date(t.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}

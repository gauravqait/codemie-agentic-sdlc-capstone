import { STATUSES, FILTER_ALL } from '../domain/constants';

export default function TaskControls({ query, status, onQueryChange, onStatusChange, onClear }) {
  const active = query !== '' || status !== FILTER_ALL;
  return (
    <div className="task-controls" role="search">
      <div className="field">
        <label htmlFor="task-search">Search tasks</label>
        <input
          id="task-search"
          type="search"
          value={query}
          placeholder="Title or description"
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="task-status-filter">Filter by status</label>
        <select id="task-status-filter" value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value={FILTER_ALL}>All</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button type="button" className="secondary" onClick={onClear} disabled={!active}>
        Clear filters
      </button>
    </div>
  );
}

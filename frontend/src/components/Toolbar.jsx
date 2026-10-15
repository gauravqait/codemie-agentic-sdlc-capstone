import { STATUSES } from '../utils/taskModel.js';

export default function Toolbar({ q, status, sort, onChange }) {
  return (
    <section aria-label="Task controls" style={{ marginBottom: 12 }}>
      <label>
        Search
        <input
          value={q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search title or description"
        />
      </label>

      <label>
        Filter by status
        <select value={status} onChange={(e) => onChange({ status: e.target.value })}>
          <option value="All">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sort
        <select value={sort} onChange={(e) => onChange({ sort: e.target.value })}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="title-asc">Title A-Z</option>
          <option value="status">Status</option>
        </select>
      </label>
    </section>
  );
}

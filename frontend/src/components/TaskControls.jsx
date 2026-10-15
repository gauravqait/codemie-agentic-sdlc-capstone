import { ALLOWED_STATUSES, SORT_OPTIONS } from '../domain/constants.js';

/**
 * Task list controls - filter, search, and sort
 */
export function TaskControls({ filters, onFiltersChange }) {
  const handleStatusChange = (e) => {
    onFiltersChange({ ...filters, status: e.target.value });
  };

  const handleSearchChange = (e) => {
    onFiltersChange({ ...filters, query: e.target.value });
  };

  const handleSortChange = (e) => {
    onFiltersChange({ ...filters, sort: e.target.value });
  };

  return (
    <div className="task-controls">
      <div className="control-group">
        <label htmlFor="status-filter">
          Status
          <select id="status-filter" value={filters.status} onChange={handleStatusChange}>
            <option value="All">All</option>
            {ALLOWED_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="control-group">
        <label htmlFor="search-input">
          Search
          <input
            id="search-input"
            type="text"
            placeholder="Search tasks..."
            value={filters.query}
            onChange={handleSearchChange}
          />
        </label>
      </div>

      <div className="control-group">
        <label htmlFor="sort-select">
          Sort by
          <select id="sort-select" value={filters.sort} onChange={handleSortChange}>
            <option value={SORT_OPTIONS.NEWEST}>Newest first</option>
            <option value={SORT_OPTIONS.OLDEST}>Oldest first</option>
            <option value={SORT_OPTIONS.TITLE_ASC}>Title A → Z</option>
            <option value={SORT_OPTIONS.TITLE_DESC}>Title Z → A</option>
          </select>
        </label>
      </div>
    </div>
  );
}

/**
 * Task list component
 */
export function TaskList({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty-state">No tasks found.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-item">
          <div className="task-content">
            <h3 className="task-title">{task.title}</h3>
            <span className="task-status">
              <small>({task.status})</small>
            </span>
            {task.description && <p className="task-description">{task.description}</p>}
            <time className="task-time" dateTime={new Date(task.createdAt).toISOString()}>
              Created: {new Date(task.createdAt).toLocaleString()}
            </time>
          </div>
          <div className="task-actions">
            <button onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>
              Edit
            </button>
            <button
              onClick={() => onDelete(task)}
              aria-label={`Delete ${task.title}`}
              className="danger"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

import { STATUSES } from '../domain/constants';
import TaskForm from './TaskForm';

const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label ?? v;
const fmt = (iso) => new Date(iso).toLocaleString();

export default function TaskList({ tasks, editingId, onEdit, onCancelEdit, onSave, onDelete }) {
  return (
    <ul className="task-list" aria-label="Tasks">
      {tasks.map((task) => (
        <li key={task.id} data-task-id={task.id} className={`task status-${task.status}`}>
          {editingId === task.id ? (
            <TaskForm
              initial={task}
              submitLabel="Save"
              autoFocus
              onSubmit={(values) => onSave(task.id, values)}
              onCancel={() => onCancelEdit(task.id)}
            />
          ) : (
            <>
              <div className="task-main">
                <h3>{task.title}</h3>
                {task.description && <p>{task.description}</p>}
                <p className="meta">
                  <span className="badge">{statusLabel(task.status)}</span> Created{' '}
                  <time dateTime={task.createdAt}>{fmt(task.createdAt)}</time>
                  {task.updatedAt !== task.createdAt && (
                    <>
                      {' '}
                      · Updated <time dateTime={task.updatedAt}>{fmt(task.updatedAt)}</time>
                    </>
                  )}
                </p>
              </div>
              <div className="actions">
                <button type="button" data-action="edit" onClick={() => onEdit(task.id)} aria-label={`Edit ${task.title}`}>
                  Edit
                </button>
                <button
                  type="button"
                  data-action="delete"
                  className="danger"
                  onClick={() => onDelete(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function TaskItem({ task, onEdit, onDelete }) {
  return (
    <li>
      <div>
        <strong>{task.title}</strong> <small>({task.status})</small>
        {task.description && <p>{task.description}</p>}
      </div>
      <div>
        <button onClick={() => onEdit(task)}>Edit</button>
        <button onClick={() => onDelete(task)}>Delete</button>
      </div>
    </li>
  );
}

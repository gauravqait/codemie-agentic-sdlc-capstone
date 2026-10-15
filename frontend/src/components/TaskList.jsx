import TaskItem from './TaskItem.jsx';

export default function TaskList({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return <p>No tasks match your filters.</p>;
  }

  return (
    <ul aria-label="Task list">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}

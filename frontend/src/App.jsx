import { useMemo, useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Toolbar from './components/Toolbar';
import useTasks from './hooks/useTasks';
import selectVisibleTasks from './selectors/selectVisibleTasks';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();

  const [editingId, setEditingId] = useState(null);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('Newest');

  const editingTask = useMemo(
    () => (editingId ? tasks.find((t) => t.id === editingId) ?? null : null),
    [editingId, tasks],
  );

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, { query, status, sort }),
    [tasks, query, status, sort],
  );

  function startEdit(task) {
    setEditingId(task.id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function submit(task) {
    if (editingId) {
      updateTask(editingId, task);
      cancelEdit();
      return;
    }

    addTask(task);
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    deleteTask(task.id);

    if (editingId === task.id) {
      cancelEdit();
    }
  }

  return (
    <main>
      <h1>Task Manager</h1>

      <Toolbar
        query={query}
        onQueryChange={setQuery}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
      />

      <TaskForm task={editingTask} onSubmit={submit} onCancel={cancelEdit} />

      {tasks.length === 0 && <p>No tasks yet.</p>}
      {tasks.length > 0 && visibleTasks.length === 0 && <p>No tasks match your filters.</p>}

      <TaskList tasks={visibleTasks} onEdit={startEdit} onDelete={remove} />
    </main>
  );
}

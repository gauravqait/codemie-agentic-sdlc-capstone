import { useMemo, useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import Toolbar from './components/Toolbar';
import { useTasks } from './hooks/useTasks.js';
import { selectVisibleTasks } from './utils/taskSelectors.js';

export default function App() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();

  const [editingId, setEditingId] = useState(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');

  const editingTask = useMemo(
    () => (editingId ? tasks.find((t) => t.id === editingId) ?? null : null),
    [editingId, tasks],
  );

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, { q, status, sort }),
    [tasks, q, status, sort],
  );

  function startEdit(task) {
    setEditingId(task.id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function handleAdd(task) {
    addTask(task);
  }

  function handleUpdate(task) {
    if (!editingId) return;

    updateTask(editingId, task);
    cancelEdit();
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
        q={q}
        status={status}
        sort={sort}
        onChange={({ q: nextQ, status: nextStatus, sort: nextSort }) => {
          if (nextQ !== undefined) setQ(nextQ);
          if (nextStatus !== undefined) setStatus(nextStatus);
          if (nextSort !== undefined) setSort(nextSort);
        }}
      />

      <TaskForm
        editingTask={editingTask}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onCancel={cancelEdit}
      />

      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : visibleTasks.length === 0 ? (
        <p>No tasks match your filters.</p>
      ) : (
        <TaskList tasks={visibleTasks} onEdit={startEdit} onDelete={remove} />
      )}
    </main>
  );
}

import { useEffect, useState } from 'react';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const EMPTY = { title: '', description: '', status: 'To Do' };

export default function App() {
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tasks')) ?? [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  function submit(e) {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return setError('Title is required.');
    const task = { ...form, title };
    setTasks(
      editingId
        ? tasks.map((t) => (t.id === editingId ? { ...t, ...task } : t))
        : [{ ...task, id: Date.now() }, ...tasks],
    );
    reset();
  }

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
    setError('');
  }

  function edit(task) {
    setForm(task);
    setEditingId(task.id);
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks(tasks.filter((t) => t.id !== task.id));
    if (editingId === task.id) reset();
  }

  return (
    <main>
      <h1>Task Manager</h1>

      <form onSubmit={submit} aria-label="Task form">
        <label>
          Title
          <input value={form.title} onChange={change('title')} />
        </label>
        {error && <p role="alert">{error}</p>}
        <label>
          Description
          <textarea value={form.description} onChange={change('description')} />
        </label>
        <label>
          Status
          <select value={form.status} onChange={change('status')}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div>
          <button type="submit">{editingId ? 'Save' : 'Add'}</button>
          {editingId && (
            <button type="button" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {tasks.length === 0 && <p>No tasks yet.</p>}
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>
            <div>
              <strong>{task.title}</strong> <small>({task.status})</small>
              {task.description && <p>{task.description}</p>}
            </div>
            <div>
              <button onClick={() => edit(task)}>Edit</button>
              <button onClick={() => remove(task)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}

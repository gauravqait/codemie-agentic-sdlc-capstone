import { useEffect, useMemo, useRef, useState } from 'react';
import TaskForm from './components/TaskForm';
import TaskControls from './components/TaskControls';
import TaskList from './components/TaskList';
import ConfirmDialog from './components/ConfirmDialog';
import LiveRegion from './components/LiveRegion';
import { loadTasks, saveTasks } from './data/storage';
import { createTask, updateTask } from './domain/tasks';
import { filterTasks } from './domain/selectors';
import { FILTER_ALL } from './domain/constants';
import './App.css';

const focusEditButton = (id) =>
  requestAnimationFrame(() => document.querySelector(`[data-task-id="${id}"] [data-action="edit"]`)?.focus());

export default function App() {
  const [initial] = useState(() => loadTasks());
  const [tasks, setTasks] = useState(initial.tasks);
  const [notice, setNotice] = useState(initial.error);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState(FILTER_ALL);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const skipFirstSave = useRef(true);

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    if (!saveTasks(tasks)) setNotice('Your changes could not be saved to this browser.');
  }, [tasks]);

  const visible = useMemo(() => filterTasks(tasks, { query, status }), [tasks, query, status]);
  const filtersActive = query.trim() !== '' || status !== FILTER_ALL;
  const deleting = tasks.find((t) => t.id === deletingId);

  const add = (values) => {
    setTasks((prev) => [createTask(values), ...prev]);
    setAnnouncement(`Task "${values.title.trim()}" added.`);
  };

  const save = (id, values) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? updateTask(t, values) : t)));
    setEditingId(null);
    setAnnouncement(`Task "${values.title.trim()}" updated.`);
    focusEditButton(id);
  };

  const cancelEdit = (id) => {
    setEditingId(null);
    focusEditButton(id);
  };

  const confirmDelete = () => {
    const idx = visible.findIndex((t) => t.id === deletingId);
    const neighbour = visible[idx + 1] ?? visible[idx - 1];
    setTasks((prev) => prev.filter((t) => t.id !== deletingId));
    setAnnouncement(`Task "${deleting.title}" deleted.`);
    if (editingId === deletingId) setEditingId(null);
    setDeletingId(null);
    // The dialog's opener is gone after deletion, so move focus to the next task or the page heading.
    setTimeout(() => {
      const target = neighbour
        ? document.querySelector(`[data-task-id="${neighbour.id}"] [data-action="edit"]`)
        : document.getElementById('app-heading');
      target?.focus();
    }, 0);
  };

  const clearFilters = () => {
    setQuery('');
    setStatus(FILTER_ALL);
  };

  return (
    <main className="app">
      <h1 id="app-heading" tabIndex={-1}>
        Task Manager
      </h1>
      <LiveRegion message={announcement} />
      {notice && (
        <div role="alert" className="banner">
          <span>{notice}</span>
          <button type="button" className="secondary" onClick={() => setNotice('')}>
            Dismiss
          </button>
        </div>
      )}

      <section aria-labelledby="add-heading">
        <h2 id="add-heading">Add a task</h2>
        <TaskForm onSubmit={add} />
      </section>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading">Your tasks</h2>
        {tasks.length > 0 && (
          <TaskControls
            query={query}
            status={status}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onClear={clearFilters}
          />
        )}
        {tasks.length === 0 ? (
          <p className="empty">No tasks yet. Add your first task above.</p>
        ) : visible.length === 0 ? (
          <div className="empty">
            <p>No tasks match your search or filter.</p>
            {filtersActive && (
              <button type="button" onClick={clearFilters}>
                Reset search and filter
              </button>
            )}
          </div>
        ) : (
          <TaskList
            tasks={visible}
            editingId={editingId}
            onEdit={setEditingId}
            onCancelEdit={cancelEdit}
            onSave={save}
            onDelete={setDeletingId}
          />
        )}
      </section>

      {deleting && (
        <ConfirmDialog
          title="Delete task?"
          message={`"${deleting.title}" will be permanently deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </main>
  );
}

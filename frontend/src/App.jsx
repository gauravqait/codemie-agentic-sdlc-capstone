import { useState, useEffect } from 'react';
import { tasksRepository } from './data/tasksRepository.js';
import { getVisibleTasks } from './domain/selectors/tasks.js';
import { TASK_STATUS, SORT_OPTIONS } from './domain/constants.js';
import { TaskForm } from './components/TaskForm.jsx';
import { TaskList } from './components/TaskList.jsx';
import { TaskControls } from './components/TaskControls.jsx';
import { LiveRegion } from './components/LiveRegion.jsx';

const EMPTY_FORM = { title: '', description: '', status: TASK_STATUS.TODO };
const INITIAL_FILTERS = { status: 'All', query: '', sort: SORT_OPTIONS.NEWEST };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [liveMessage, setLiveMessage] = useState('');

  // Load tasks on mount
  useEffect(() => {
    const loadedTasks = tasksRepository.getAll();
    setTasks(loadedTasks);
  }, []);

  // Get visible tasks after applying filters
  const visibleTasks = getVisibleTasks(tasks, filters);

  const handleFormChange = (newForm) => {
    setForm(newForm);
  };

  const handleSubmit = () => {
    if (editingId) {
      // Update existing task
      const updated = tasksRepository.update(editingId, form);
      if (updated) {
        setTasks(tasks.map((t) => (t.id === editingId ? updated : t)));
        setLiveMessage(`Task "${updated.title}" updated.`);
      }
    } else {
      // Create new task
      const created = tasksRepository.create(form);
      setTasks([created, ...tasks]);
      setLiveMessage(`Task "${created.title}" created.`);
    }
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    setLiveMessage('Edit cancelled.');
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
    });
    setEditingId(task.id);
    setLiveMessage(`Editing task "${task.title}".`);
  };

  const handleDelete = (task) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    const success = tasksRepository.remove(task.id);
    if (success) {
      setTasks(tasks.filter((t) => t.id !== task.id));
      if (editingId === task.id) resetForm();
      setLiveMessage(`Task "${task.title}" deleted.`);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  return (
    <main className="app">
      <header>
        <h1>Task Manager</h1>
        <p className="subtitle">Enhanced with filtering, search, and accessibility</p>
      </header>

      <section aria-labelledby="form-heading">
        <h2 id="form-heading">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
        <TaskForm
          form={form}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={!!editingId}
        />
      </section>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading">Tasks ({visibleTasks.length})</h2>
        <TaskControls filters={filters} onFiltersChange={setFilters} />
        <TaskList tasks={visibleTasks} onEdit={handleEdit} onDelete={handleDelete} />
      </section>

      <LiveRegion message={liveMessage} />
    </main>
  );
}

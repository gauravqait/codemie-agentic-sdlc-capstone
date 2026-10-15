import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App.jsx';

function mockRandomUUID() {
  const original = globalThis.crypto?.randomUUID;
  const fn = vi.fn();
  let i = 0;
  fn.mockImplementation(() => `uuid-${++i}`);
  if (!globalThis.crypto) globalThis.crypto = {};
  globalThis.crypto.randomUUID = fn;
  return () => {
    if (original) globalThis.crypto.randomUUID = original;
    else delete globalThis.crypto.randomUUID;
  };
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function addTask(user, title, description) {
  const titleInput = screen.getByLabelText('Title');
  await user.clear(titleInput);
  if (title != null) await user.type(titleInput, title);

  if (description != null) {
    const descInput = screen.queryByLabelText('Description');
    if (descInput) {
      await user.clear(descInput);
      await user.type(descInput, description);
    }
  }

  await user.click(screen.getByRole('button', { name: 'Add' }));
}

it('adds a task', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Buy milk', 'From store');

  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  restoreUUID();
});

it('rejects an empty title (field-level error under Title) and focuses Title', async () => {
  const user = userEvent.setup();
  render(<App />);

  const titleInput = screen.getByLabelText('Title');
  titleInput.focus();
  expect(titleInput).toHaveFocus();

  await user.click(screen.getByRole('button', { name: 'Add' }));

  // Field-level error should be associated with the Title field (no global alert requirement).
  expect(screen.getByText('Title is required.')).toBeInTheDocument();
  expect(screen.getByLabelText('Title')).toHaveFocus();
});

it('trims the title on submit', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, '   Buy milk   ', 'Test');

  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  expect(screen.queryByText('   Buy milk   ')).not.toBeInTheDocument();
  restoreUUID();
});

it('focus moves to Title on successful add', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Focus test', 'Any');

  expect(screen.getByText('Focus test')).toBeInTheDocument();
  expect(screen.getByLabelText('Title')).toHaveFocus();
  restoreUUID();
});

it('edits a task (works with new model)', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Old', 'Original description');

  await user.click(screen.getByRole('button', { name: 'Edit' }));

  const titleInput = screen.getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'New');

  const descInput = screen.queryByLabelText('Description');
  if (descInput) {
    await user.clear(descInput);
    await user.type(descInput, 'Updated description');
  }

  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
  restoreUUID();
});

it('deletes a task after confirmation (mock window.confirm)', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);

  await addTask(user, 'Temp', 'To delete');
  await user.click(screen.getByRole('button', { name: 'Delete' }));

  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
  restoreUUID();
});

it('filters by status works (All vs Done)', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Task A', 'desc a');
  await addTask(user, 'Task B', 'desc b');

  // Mark "Task A" as done using its checkbox (assumed accessible name equals title)
  const taskACheckbox = screen.getByRole('checkbox', { name: 'Task A' });
  await user.click(taskACheckbox);

  const statusSelect = screen.getByLabelText('Filter by status');

  await user.selectOptions(statusSelect, 'Done');
  expect(screen.getByText('Task A')).toBeInTheDocument();
  expect(screen.queryByText('Task B')).not.toBeInTheDocument();

  await user.selectOptions(statusSelect, 'All');
  expect(screen.getByText('Task A')).toBeInTheDocument();
  expect(screen.getByText('Task B')).toBeInTheDocument();
  restoreUUID();
});

it('search works on title and description', async () => {
  const restoreUUID = mockRandomUUID();
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Walk dog', 'Park loop');
  await addTask(user, 'Buy milk', '2% dairy');

  const searchInput = screen.getByLabelText('Search');

  await user.type(searchInput, 'milk');
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  expect(screen.queryByText('Walk dog')).not.toBeInTheDocument();

  await user.clear(searchInput);
  await user.type(searchInput, 'park');
  expect(screen.getByText('Walk dog')).toBeInTheDocument();
  expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();

  restoreUUID();
});

it('migrates legacy storage (array) to envelope with version and displays tasks', async () => {
  const legacy = [
    {
      id: 'legacy-1',
      title: 'Legacy task',
      description: 'From old storage',
      done: false,
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    },
  ];
  localStorage.setItem('tasks', JSON.stringify(legacy));

  render(<App />);

  expect(screen.getByText('Legacy task')).toBeInTheDocument();

  const rewritten = JSON.parse(localStorage.getItem('tasks'));
  expect(rewritten).toBeTruthy();
  expect(typeof rewritten).toBe('object');
  expect(rewritten.version).toBeDefined();
  expect(Array.isArray(rewritten.tasks)).toBe(true);
  expect(rewritten.tasks.some((t) => t.title === 'Legacy task')).toBe(true);
});
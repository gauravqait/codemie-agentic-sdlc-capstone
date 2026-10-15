import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App.jsx';

function getPriorityControl() {
  return screen.getByLabelText(/^priority$/i);
}

function getDueDateInput() {
  return screen.getByLabelText(/^due date$/i);
}

function getSearchInput() {
  // New UI exposes aria-label "Search tasks"
  return screen.getByLabelText(/^search tasks$/i);
}

function getStatusFilterControl() {
  return screen.getByLabelText(/^filter by status$/i);
}

function getPriorityFilterControl() {
  return screen.getByLabelText(/^filter by priority$/i);
}

function getSortByControl() {
  return screen.getByLabelText(/^sort by$/i);
}

function getTaskItemByTitle(title) {
  const titleEl = screen.getByText(title);
  const li = titleEl.closest('li');
  if (li) return li;

  const listItem = titleEl.closest('[role="listitem"]');
  if (listItem) return listItem;

  const row = titleEl.closest('[data-testid^="task"], [data-testid*="task"]');
  if (row) return row;

  return titleEl.parentElement ?? titleEl;
}

async function addTask(user, { title, priority, dueDate } = {}) {
  const titleInput = screen.getByLabelText(/title/i);

  if (title !== undefined) {
    await user.clear(titleInput);
    if (title) await user.type(titleInput, title);
  }

  const priorityControl = getPriorityControl();
  if (priority !== undefined && priorityControl) {
    if (priorityControl.tagName.toLowerCase() === 'select') {
      await user.selectOptions(priorityControl, priority);
    } else {
      await user.clear(priorityControl);
      if (priority) await user.type(priorityControl, priority);
    }
  }

  const dueDateInput = getDueDateInput();
  if (dueDate !== undefined && dueDateInput) {
    await user.clear(dueDateInput);
    if (dueDate) await user.type(dueDateInput, dueDate);
  }

  const addButton =
    screen.queryByRole('button', { name: /^add$/i }) ??
    screen.queryByRole('button', { name: /add task/i }) ??
    screen.getByRole('button', { name: /add/i });

  await user.click(addButton);
}

async function addTaskWithDefaultPriority(user, { title, dueDate } = {}) {
  const priorityControl = getPriorityControl();
  let defaultPriorityValue;

  if (priorityControl) {
    if (priorityControl.tagName.toLowerCase() === 'select') {
      const options = within(priorityControl).getAllByRole('option');
      const selected = options.find((o) => o.selected) ?? options[0];
      defaultPriorityValue =
        selected?.getAttribute('value') ?? selected?.textContent ?? undefined;
    } else {
      defaultPriorityValue = priorityControl.value;
    }
  }

  await addTask(user, {
    title,
    dueDate,
    ...(defaultPriorityValue !== undefined ? { priority: defaultPriorityValue } : {}),
  });

  return defaultPriorityValue;
}

async function openEditForTask(user, title) {
  const item = getTaskItemByTitle(title);
  const editButton =
    within(item).queryByRole('button', { name: /^edit$/i }) ??
    within(item).queryByRole('button', { name: /edit/i }) ??
    within(item).queryByRole('button', { name: /update/i }) ??
    within(item).getByRole('button', { name: /edit|update/i });
  await user.click(editButton);
  return item;
}

async function commitEdit(user) {
  const saveButton =
    screen.queryByRole('button', { name: /^save$/i }) ??
    screen.queryByRole('button', { name: /save changes/i }) ??
    screen.queryByRole('button', { name: /^update$/i }) ??
    screen.queryByRole('button', { name: /done/i }) ??
    screen.getByRole('button', { name: /save|update|done/i });
  await user.click(saveButton);
}

async function openDeleteModalForTask(user, title) {
  const item = getTaskItemByTitle(title);
  const deleteButton = within(item).getByRole('button', { name: /^delete$/i });
  await user.click(deleteButton);
}

async function confirmDeleteModal(user) {
  // New UI uses ConfirmDialog: role="dialog" + a "Delete" confirm button.
  const dialog = await screen.findByRole('dialog');
  const confirmButton = within(dialog).getByRole('button', { name: /^delete$/i });
  await user.click(confirmButton);
}

async function cancelModal(user) {
  const dialog = await screen.findByRole('dialog');
  const cancelButton = within(dialog).getByRole('button', { name: /cancel|close/i });
  await user.click(cancelButton);
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('adds a task and uses the default priority from the UI', async () => {
  const user = userEvent.setup();
  render(<App />);

  const titleInput = screen.getByLabelText(/title/i);
  expect(titleInput).toBeInTheDocument();

  const priorityControl = getPriorityControl();
  expect(priorityControl).toBeInTheDocument();

  const dueDateInput = getDueDateInput();
  expect(dueDateInput).toBeInTheDocument();

  if (priorityControl) {
    if (priorityControl.tagName.toLowerCase() === 'select') {
      const selected = within(priorityControl).getAllByRole('option').find((o) => o.selected);
      expect((selected?.textContent ?? '').trim().length).toBeGreaterThan(0);
    } else {
      expect(priorityControl).toHaveValue(expect.any(String));
    }
  }

  expect(dueDateInput).toHaveValue(expect.any(String));

  const defaultPriority = await addTaskWithDefaultPriority(user, { title: 'Buy milk' });
  expect(screen.getByText('Buy milk')).toBeInTheDocument();

  if (defaultPriority !== undefined) {
    expect(defaultPriority.toString().trim().length).toBeGreaterThan(0);
  }
});

it('validation focuses the first invalid field (title)', async () => {
  const user = userEvent.setup();
  render(<App />);

  const addButton =
    screen.queryByRole('button', { name: /^add$/i }) ??
    screen.queryByRole('button', { name: /add task/i }) ??
    screen.getByRole('button', { name: /add/i });

  await user.click(addButton);

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(/title is required/i);

  const titleInput = screen.getByLabelText(/title/i);
  expect(titleInput).toHaveFocus();
});

it('edits a task title', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTaskWithDefaultPriority(user, { title: 'Original title' });
  expect(screen.getByText('Original title')).toBeInTheDocument();

  const item = await openEditForTask(user, 'Original title');

  const titleInput =
    within(item).queryByRole('textbox', { name: /title/i }) ??
    within(item).queryByLabelText(/title/i) ??
    screen.queryByRole('textbox', { name: /title/i }) ??
    screen.queryByLabelText(/title/i);

  expect(titleInput).toBeInTheDocument();

  await user.clear(titleInput);
  await user.type(titleInput, 'Updated title');

  await commitEdit(user);

  expect(screen.getByText('Updated title')).toBeInTheDocument();
  expect(screen.queryByText('Original title')).not.toBeInTheDocument();
});

it('deletes a task by clicking Delete then confirming in a modal', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTaskWithDefaultPriority(user, { title: 'Temp' });
  await openDeleteModalForTask(user, 'Temp');

  const dialog = await screen.findByRole('dialog');
  expect(dialog).toBeInTheDocument();

  await confirmDeleteModal(user);
  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
});

it('cancels delete in modal and keeps the task', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTaskWithDefaultPriority(user, { title: 'Keep me' });
  await openDeleteModalForTask(user, 'Keep me');

  const dialog = await screen.findByRole('dialog');
  expect(dialog).toBeInTheDocument();

  await cancelModal(user);
  expect(screen.getByText('Keep me')).toBeInTheDocument();
});

it('undo restores a deleted task (toast action "Undo")', async () => {
  vi.useFakeTimers();

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<App />);

  await addTaskWithDefaultPriority(user, { title: 'Undo me' });
  await openDeleteModalForTask(user, 'Undo me');
  await confirmDeleteModal(user);

  expect(screen.queryByText('Undo me')).not.toBeInTheDocument();

  const undoButton = await screen.findByRole('button', { name: /^undo$/i });
  await user.click(undoButton);

  // Advance timers to flush any queued state updates/timeouts used by the toast/undo flow.
  await act(async () => {
    vi.runOnlyPendingTimers();
    vi.advanceTimersByTime(1);
  });

  expect(screen.getByText('Undo me')).toBeInTheDocument();
});

it('search filters tasks (aria-label "Search tasks")', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Alpha task', priority: 'Low' });
  await addTask(user, { title: 'Bravo task', priority: 'High' });
  await addTask(user, { title: 'Charlie task', priority: 'Low' });

  const searchInput = getSearchInput();
  await user.clear(searchInput);
  await user.type(searchInput, 'bravo');

  expect(screen.getByText('Bravo task')).toBeInTheDocument();
  expect(screen.queryByText('Alpha task')).not.toBeInTheDocument();
  expect(screen.queryByText('Charlie task')).not.toBeInTheDocument();

  await user.clear(searchInput);
  expect(screen.getByText('Alpha task')).toBeInTheDocument();
  expect(screen.getByText('Bravo task')).toBeInTheDocument();
  expect(screen.getByText('Charlie task')).toBeInTheDocument();
});

it('filters by status (aria-label "Filter by status")', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Do soon', priority: 'Low' });
  await addTask(user, { title: 'Do later', priority: 'High' });

  const statusFilter = getStatusFilterControl();

  // App statuses: 'To Do', 'In Progress', 'Done'
  await user.selectOptions(statusFilter, 'Done');

  // Newly-added tasks are typically not "Done", so they should be hidden.
  expect(screen.queryByText('Do soon')).not.toBeInTheDocument();
  expect(screen.queryByText('Do later')).not.toBeInTheDocument();

  await user.selectOptions(statusFilter, 'All');
  expect(screen.getByText('Do soon')).toBeInTheDocument();
  expect(screen.getByText('Do later')).toBeInTheDocument();
});

it('filters by priority (aria-label "Filter by priority")', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Alpha task', priority: 'Low' });
  await addTask(user, { title: 'Bravo task', priority: 'High' });
  await addTask(user, { title: 'Charlie task', priority: 'Low' });

  const priorityFilter = getPriorityFilterControl();
  await user.selectOptions(priorityFilter, 'High');

  expect(screen.getByText('Bravo task')).toBeInTheDocument();
  expect(screen.queryByText('Alpha task')).not.toBeInTheDocument();
  expect(screen.queryByText('Charlie task')).not.toBeInTheDocument();

  await user.selectOptions(priorityFilter, 'All');
  expect(screen.getByText('Alpha task')).toBeInTheDocument();
  expect(screen.getByText('Bravo task')).toBeInTheDocument();
  expect(screen.getByText('Charlie task')).toBeInTheDocument();
});

it('sorts tasks (aria-label "Sort by") and supports known sort keys (createdAtDesc)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTaskWithDefaultPriority(user, { title: 'First' });
  await addTaskWithDefaultPriority(user, { title: 'Second' });
  await addTaskWithDefaultPriority(user, { title: 'Third' });

  const sortBy = getSortByControl();
  await user.selectOptions(sortBy, 'createdAtDesc');

  // With createdAtDesc, newest should appear first in the rendered list.
  const third = screen.getByText('Third');
  const second = screen.getByText('Second');
  const first = screen.getByText('First');

  // Assert order: Third before Second before First.
  expect(
    Boolean(third.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING),
  ).toBe(true);
  expect(
    Boolean(second.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING),
  ).toBe(true);
});

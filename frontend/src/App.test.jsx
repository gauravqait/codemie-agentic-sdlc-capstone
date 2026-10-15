import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App.jsx';

function getPriorityControl() {
  return (
    screen.queryByLabelText(/^priority$/i) ??
    screen.queryByRole('combobox', { name: /^priority$/i }) ??
    screen.queryByRole('combobox', { name: /priority/i })
  );
}

function getDueDateInput() {
  return screen.queryByLabelText(/^due date$/i) ?? screen.queryByLabelText(/due date/i);
}

function getSearchInput() {
  return (
    screen.queryByRole('searchbox', { name: /^search$/i }) ??
    screen.queryByRole('searchbox') ??
    screen.queryByLabelText(/^search$/i) ??
    screen.queryByPlaceholderText(/^search$/i) ??
    screen.queryByLabelText(/search/i) ??
    screen.queryByPlaceholderText(/search/i)
  );
}

function getFilterControl() {
  return (
    screen.queryByRole('combobox', { name: /filter/i }) ??
    screen.queryByLabelText(/filter/i) ??
    screen.queryByRole('combobox', { name: /priority/i })
  );
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
  const deleteButton =
    within(item).queryByRole('button', { name: /^delete$/i }) ??
    within(item).queryByRole('button', { name: /delete/i }) ??
    within(item).queryByRole('button', { name: /^remove$/i }) ??
    within(item).getByRole('button', { name: /delete|remove/i });

  await user.click(deleteButton);
}

async function confirmDeleteModal(user) {
  const dialog = await screen.findByRole('dialog');
  const confirmButton =
    within(dialog).queryByRole('button', { name: /^confirm$/i }) ??
    within(dialog).queryByRole('button', { name: /confirm/i }) ??
    within(dialog).queryByRole('button', { name: /^delete$/i }) ??
    within(dialog).queryByRole('button', { name: /delete/i }) ??
    within(dialog).queryByRole('button', { name: /^remove$/i }) ??
    within(dialog).queryByRole('button', { name: /remove/i }) ??
    within(dialog).getByRole('button', { name: /confirm|delete|remove|yes|ok/i });

  await user.click(confirmButton);
}

async function cancelModal(user) {
  const dialog = await screen.findByRole('dialog');
  const cancelButton =
    within(dialog).queryByRole('button', { name: /cancel|no|close/i }) ??
    within(dialog).queryByRole('button', { name: /dismiss/i }) ??
    within(dialog).getByRole('button', { name: /cancel|no|close|dismiss/i });
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

it('undo restores a deleted task (using fake timers)', async () => {
  vi.useFakeTimers();

  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(<App />);

  await addTaskWithDefaultPriority(user, { title: 'Undo me' });
  await openDeleteModalForTask(user, 'Undo me');
  await confirmDeleteModal(user);

  expect(screen.queryByText('Undo me')).not.toBeInTheDocument();

  const undoButton =
    screen.queryByRole('button', { name: /undo/i }) ??
    screen.queryByRole('button', { name: /restore/i });
  expect(undoButton).toBeInTheDocument();

  await user.click(undoButton);

  await act(async () => {
    vi.runOnlyPendingTimers();
  });

  expect(screen.getByText('Undo me')).toBeInTheDocument();
});

it('search filters tasks and filter by priority shows only matching tasks (if exposed)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Alpha task', priority: 'Low' });
  await addTask(user, { title: 'Bravo task', priority: 'High' });
  await addTask(user, { title: 'Charlie task', priority: 'Low' });

  const searchInput = getSearchInput();
  expect(searchInput).toBeInTheDocument();

  await user.clear(searchInput);
  await user.type(searchInput, 'bravo');

  expect(screen.getByText('Bravo task')).toBeInTheDocument();
  expect(screen.queryByText('Alpha task')).not.toBeInTheDocument();
  expect(screen.queryByText('Charlie task')).not.toBeInTheDocument();

  await user.clear(searchInput);
  expect(screen.getByText('Alpha task')).toBeInTheDocument();
  expect(screen.getByText('Bravo task')).toBeInTheDocument();
  expect(screen.getByText('Charlie task')).toBeInTheDocument();

  const filterControl = getFilterControl();
  if (!filterControl) return;

  if (filterControl.tagName.toLowerCase() === 'select') {
    const opts = within(filterControl).getAllByRole('option');
    const highOpt = opts.find(
      (o) =>
        /high/i.test(o.textContent ?? '') || /high/i.test(o.getAttribute('value') ?? '')
    );
    if (highOpt) {
      await user.selectOptions(
        filterControl,
        highOpt.getAttribute('value') ?? highOpt.textContent ?? ''
      );
      expect(screen.getByText('Bravo task')).toBeInTheDocument();
      expect(screen.queryByText('Alpha task')).not.toBeInTheDocument();
      expect(screen.queryByText('Charlie task')).not.toBeInTheDocument();
    }
  } else {
    expect(filterControl).toBeInTheDocument();
  }
});
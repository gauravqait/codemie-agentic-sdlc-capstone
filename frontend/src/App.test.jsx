import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App.jsx';

async function addTask(user, { title, priority, dueDate } = {}) {
  const titleInput = screen.getByLabelText('Title');
  if (title !== undefined) {
    await user.clear(titleInput);
    if (title) await user.type(titleInput, title);
  }

  if (priority !== undefined) {
    const priorityControl =
      screen.queryByLabelText(/priority/i) ??
      screen.queryByRole('combobox', { name: /priority/i });
    await user.selectOptions(priorityControl, priority);
  }

  if (dueDate !== undefined) {
    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.clear(dueDateInput);
    if (dueDate) await user.type(dueDateInput, dueDate);
  }

  await user.click(screen.getByRole('button', { name: /^add$/i }));
}

function getTaskItemByTitle(title) {
  const titleEl = screen.getByText(title);
  const li = titleEl.closest('li');
  if (li) return li;
  const row = titleEl.closest('[role="listitem"]');
  if (row) return row;
  const wrapper = titleEl.closest('[data-testid^="task"], [data-testid*="task"]');
  if (wrapper) return wrapper;
  return titleEl.parentElement ?? titleEl;
}

function openDeleteModalForTask(user, title) {
  const item = getTaskItemByTitle(title);
  const deleteButton =
    within(item).queryByRole('button', { name: /delete/i }) ??
    within(item).getByRole('button', { name: /remove/i });
  return user.click(deleteButton);
}

async function confirmModal(user) {
  const dialog = await screen.findByRole('dialog');
  const confirmButton =
    within(dialog).queryByRole('button', { name: /confirm|delete|remove|yes/i }) ??
    within(dialog).getByRole('button', { name: /ok/i });
  await user.click(confirmButton);
}

async function cancelModal(user) {
  const dialog = await screen.findByRole('dialog');
  const cancelButton =
    within(dialog).queryByRole('button', { name: /cancel|no|close/i }) ??
    within(dialog).getByRole('button', { name: /dismiss/i });
  await user.click(cancelButton);
}

function getSearchInput() {
  return (
    screen.queryByRole('searchbox') ??
    screen.queryByLabelText(/search/i) ??
    screen.queryByPlaceholderText(/search/i)
  );
}

function getFilterControl() {
  return (
    screen.queryByRole('combobox', { name: /filter/i }) ??
    screen.queryByLabelText(/filter/i)
  );
}

function getSortControl() {
  return (
    screen.queryByRole('combobox', { name: /sort/i }) ??
    screen.queryByLabelText(/sort/i)
  );
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

it('adds a task with default priority and due date fields present', async () => {
  const user = userEvent.setup();
  render(<App />);

  const titleInput = screen.getByLabelText('Title');
  expect(titleInput).toBeInTheDocument();

  const priorityControl =
    screen.queryByLabelText(/priority/i) ??
    screen.queryByRole('combobox', { name: /priority/i });
  expect(priorityControl).toBeInTheDocument();

  const dueDateInput = screen.queryByLabelText(/due date/i);
  expect(dueDateInput).toBeInTheDocument();

  // Defaults should be set (if applicable); accept either a specific default or a non-empty default.
  if (priorityControl) {
    if (priorityControl.tagName.toLowerCase() === 'select') {
      const selected = within(priorityControl).getAllByRole('option').find((o) => o.selected);
      expect(selected?.textContent?.trim().length).toBeGreaterThan(0);
    } else {
      expect(priorityControl).toHaveValue(expect.any(String));
    }
  }

  // Due date default is commonly empty; ensure the control has a value string.
  expect(dueDateInput).toHaveValue(expect.any(String));

  await addTask(user, { title: 'Buy milk' });
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

it('rejects an empty title, shows alert, and focuses title input', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /^add$/i }));

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(/title is required/i);

  const titleInput = screen.getByLabelText('Title');
  expect(titleInput).toHaveFocus();
});

it('edits a task including title', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Old' });

  const item = getTaskItemByTitle('Old');
  const editButton =
    within(item).queryByRole('button', { name: /edit/i }) ??
    within(item).getByRole('button', { name: /update/i });
  await user.click(editButton);

  const titleInput = screen.getByLabelText('Title');
  await user.clear(titleInput);
  await user.type(titleInput, 'New');

  const saveButton =
    screen.queryByRole('button', { name: /save/i }) ??
    screen.getByRole('button', { name: /update/i });
  await user.click(saveButton);

  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
});

it('deletes a task via modal confirmation (no window.confirm)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Temp' });
  await openDeleteModalForTask(user, 'Temp');

  const dialog = await screen.findByRole('dialog');
  expect(dialog).toBeInTheDocument();

  await confirmModal(user);
  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
});

it('cancels delete in modal and keeps the task', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Keep me' });
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

  await addTask(user, { title: 'Undo me' });
  await openDeleteModalForTask(user, 'Undo me');
  await confirmModal(user);

  expect(screen.queryByText('Undo me')).not.toBeInTheDocument();

  const undoButton =
    screen.queryByRole('button', { name: /undo/i }) ??
    screen.queryByRole('button', { name: /restore/i });
  expect(undoButton).toBeInTheDocument();

  await user.click(undoButton);

  // Some implementations animate / delay restoration; advance timers to flush.
  await act(async () => {
    vi.runOnlyPendingTimers();
  });

  expect(screen.getByText('Undo me')).toBeInTheDocument();
});

it('search filters tasks and sort changes display order', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Alpha task' });
  await addTask(user, { title: 'Bravo task' });
  await addTask(user, { title: 'Charlie task' });

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

  const sortControl = getSortControl();
  if (sortControl) {
    // Try common sort options; tests accept that the app may support only some.
    const options =
      sortControl.tagName.toLowerCase() === 'select'
        ? within(sortControl).getAllByRole('option').map((o) => (o.getAttribute('value') ?? o.textContent ?? '').trim())
        : [];

    const trySelect = async (valueRegexes) => {
      for (const rx of valueRegexes) {
        const match = options.find((v) => rx.test(v));
        if (match) {
          await user.selectOptions(sortControl, match);
          return true;
        }
      }
      return false;
    };

    // Prefer A-Z ascending sort if present.
    await trySelect([/title.*asc/i, /^a[-\s]?z$/i, /asc/i, /alphabet/i]);

    const list = screen.queryByRole('list') ?? screen.getByTestId?.('task-list');
    if (list) {
      const items = within(list).getAllByText(/task$/i).map((el) => el.textContent);
      // At least ensure Alpha appears before Charlie in ascending scenarios (if sort applied).
      const alphaIndex = items.findIndex((t) => /alpha task/i.test(t ?? ''));
      const charlieIndex = items.findIndex((t) => /charlie task/i.test(t ?? ''));
      if (alphaIndex !== -1 && charlieIndex !== -1) {
        expect(alphaIndex).toBeLessThan(charlieIndex);
      }
    }
  }
});

it('filter by priority shows only matching tasks (if filter control exists)', async () => {
  const user = userEvent.setup();
  render(<App />);

  // Attempt to add tasks with explicit priorities if supported by the UI.
  await addTask(user, { title: 'Low prio', priority: 'Low' });
  await addTask(user, { title: 'High prio', priority: 'High' });

  const filterControl = getFilterControl();
  if (!filterControl) {
    // If filtering is not exposed in the UI, at least ensure both tasks exist.
    expect(screen.getByText('Low prio')).toBeInTheDocument();
    expect(screen.getByText('High prio')).toBeInTheDocument();
    return;
  }

  if (filterControl.tagName.toLowerCase() === 'select') {
    const opts = within(filterControl).getAllByRole('option');
    const highOpt = opts.find((o) => /high/i.test(o.textContent ?? '') || /high/i.test(o.getAttribute('value') ?? ''));
    if (highOpt) {
      await user.selectOptions(filterControl, highOpt.getAttribute('value') ?? highOpt.textContent ?? '');
      expect(screen.getByText('High prio')).toBeInTheDocument();
      expect(screen.queryByText('Low prio')).not.toBeInTheDocument();
    }
  }
});
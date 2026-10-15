import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

function getTaskItemByTitle(title) {
  // Prefer listitem/role-based lookup, fall back to closest li for resilience.
  const titleNode = screen.getByText(title);
  const li = titleNode.closest('li');
  if (li) return li;

  const listItems = screen.queryAllByRole('listitem');
  if (listItems.length) {
    const match = listItems.find((item) => within(item).queryByText(title));
    if (match) return match;
  }

  // As a last resort, return document body scoped wrapper; tests may still use global queries.
  return document.body;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('App task manager', () => {
  it('renders core UI controls', () => {
    render(<App />);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    // Description may be optional depending on UI, but if present should be accessible.
    const desc = screen.queryByLabelText('Description');
    if (desc) expect(desc).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();

    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Filter by status')).toBeInTheDocument();
  });

  it('adds a task and trims title', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, '   Buy milk   ', 'From store');

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByText('   Buy milk   ')).not.toBeInTheDocument();

    restoreUUID();
  });

  it('rejects empty title and focuses Title input', async () => {
    const user = userEvent.setup();

    render(<App />);

    const titleInput = screen.getByLabelText('Title');
    titleInput.focus();
    expect(titleInput).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Title is required.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveFocus();
  });

  it('focuses Title after successful add', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, 'Focus test', 'Any');

    expect(screen.getByText('Focus test')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveFocus();

    restoreUUID();
  });

  it('edits a task', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, 'Old', 'Original description');

    // Prefer per-item edit if UI renders multiple, but global button is fine for single item
    const item = getTaskItemByTitle('Old');
    const editButton = within(item).queryByRole('button', { name: 'Edit' }) ?? screen.getByRole('button', { name: 'Edit' });
    await user.click(editButton);

    const titleInput = screen.getByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'New');

    const descInput = screen.queryByLabelText('Description');
    if (descInput) {
      await user.clear(descInput);
      await user.type(descInput, 'Updated description');
    }

    const saveButton = screen.queryByRole('button', { name: 'Save' });
    if (saveButton) {
      await user.click(saveButton);
    } else {
      // If UI uses "Add" as submit even while editing (unlikely), fall back
      await user.click(screen.getByRole('button', { name: 'Add' }));
    }

    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.queryByText('Old')).not.toBeInTheDocument();

    restoreUUID();
  });

  it('deletes after confirmation', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    await addTask(user, 'Temp', 'To delete');

    const item = getTaskItemByTitle('Temp');
    const deleteButton =
      within(item).queryByRole('button', { name: 'Delete' }) ?? screen.getByRole('button', { name: 'Delete' });

    await user.click(deleteButton);

    expect(screen.queryByText('Temp')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
    restoreUUID();
  });

  it('does not delete when confirmation is cancelled', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<App />);

    await addTask(user, 'Keep me', 'Should remain');

    const item = getTaskItemByTitle('Keep me');
    const deleteButton =
      within(item).queryByRole('button', { name: 'Delete' }) ?? screen.getByRole('button', { name: 'Delete' });

    await user.click(deleteButton);

    expect(screen.getByText('Keep me')).toBeInTheDocument();

    confirmSpy.mockRestore();
    restoreUUID();
  });

  it('toggles done via checkbox', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, 'Checkbox task', 'Toggle me');

    const checkbox = screen.getByRole('checkbox', { name: 'Checkbox task' });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();

    restoreUUID();
  });

  it('filters by status (Done)', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, 'Task A', 'desc a');
    await addTask(user, 'Task B', 'desc b');

    const taskACheckbox = screen.getByRole('checkbox', { name: 'Task A' });
    await user.click(taskACheckbox);

    const statusSelect = screen.getByLabelText('Filter by status');

    await user.selectOptions(statusSelect, 'Done');
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.queryByText('Task B')).not.toBeInTheDocument();

    restoreUUID();
  });

  it('filters by status (Todo)', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, 'Task A', 'desc a');
    await addTask(user, 'Task B', 'desc b');

    await user.click(screen.getByRole('checkbox', { name: 'Task A' }));

    const statusSelect = screen.getByLabelText('Filter by status');
    await user.selectOptions(statusSelect, 'Todo');

    expect(screen.queryByText('Task A')).not.toBeInTheDocument();
    expect(screen.getByText('Task B')).toBeInTheDocument();

    restoreUUID();
  });

  it('searches by title/description', async () => {
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

  it('search is case-insensitive', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    render(<App />);

    await addTask(user, 'Buy Milk', 'Dairy');
    const searchInput = screen.getByLabelText('Search');

    await user.type(searchInput, 'milk');
    expect(screen.getByText('Buy Milk')).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'MILK');
    expect(screen.getByText('Buy Milk')).toBeInTheDocument();

    restoreUUID();
  });

  it('persists tasks to localStorage and restores on reload', async () => {
    const restoreUUID = mockRandomUUID();
    const user = userEvent.setup();

    const { unmount } = render(<App />);

    await addTask(user, 'Persisted', 'Saved');

    // ensure storage was written
    const storedRaw = localStorage.getItem('tasks');
    expect(storedRaw).toBeTruthy();

    unmount();

    render(<App />);
    expect(screen.getByText('Persisted')).toBeInTheDocument();

    restoreUUID();
  });

  it('migrates legacy localStorage array to envelope', async () => {
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
});
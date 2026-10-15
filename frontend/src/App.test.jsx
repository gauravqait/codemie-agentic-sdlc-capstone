import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi, beforeEach, afterEach, describe } from 'vitest';
import App from './App.jsx';

async function addTask(user, { title, description } = {}) {
  if (title !== undefined) {
    await user.clear(screen.getByLabelText(/title/i));
    await user.type(screen.getByLabelText(/title/i), title);
  }
  if (description !== undefined) {
    await user.clear(screen.getByLabelText(/description/i));
    await user.type(screen.getByLabelText(/description/i), description);
  }
  await user.click(screen.getByRole('button', { name: /add/i }));
}

function getTaskItemByTitle(title) {
  const titleNode = screen.getByText(title);
  const item = titleNode.closest('li') ?? titleNode.closest('[role="listitem"]') ?? titleNode.parentElement;
  if (!item) throw new Error(`Could not find list item container for task titled "${title}"`);
  return item;
}

function getTaskControls(title) {
  const item = getTaskItemByTitle(title);
  return {
    item,
    editButton: within(item).getByRole('button', { name: /edit/i }),
    deleteButton: within(item).getByRole('button', { name: /delete/i }),
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('adds a task with a required title and optional description', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Buy milk', description: '2% organic' });

  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  expect(screen.getByText('2% organic')).toBeInTheDocument();
});

it('adds a task when description is omitted', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'No description' });

  expect(screen.getByText('No description')).toBeInTheDocument();
  expect(screen.queryByText(/description/i)).not.toHaveTextContent('No description');
});

it('rejects an empty title, shows error message, and focuses title input', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: /add/i }));

  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent(/title/i);
  expect(alert).toHaveTextContent(/required/i);

  expect(screen.getByLabelText(/title/i)).toHaveFocus();
});

it('shows a save-failure banner when localStorage.setItem throws', async () => {
  const user = userEvent.setup();

  vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });

  render(<App />);

  await addTask(user, { title: 'Will fail to persist', description: 'Still added in UI' });

  // Task still appears in UI
  expect(screen.getByText('Will fail to persist')).toBeInTheDocument();

  // Banner/notification about save failure
  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent(/save|persist|storage/i);
  expect(banner).toHaveTextContent(/failed|error|unable/i);
});

it('shows a load warning banner when stored JSON is corrupted', async () => {
  const user = userEvent.setup();

  vi.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('{"not valid json"');

  render(<App />);

  const banner = screen.getByRole('status');
  expect(banner).toHaveTextContent(/load|storage|restore/i);
  expect(banner).toHaveTextContent(/warning|corrupt|invalid|failed/i);

  // App should still be usable after warning
  await addTask(user, { title: 'After warning' });
  expect(screen.getByText('After warning')).toBeInTheDocument();

  // ensure banner still exists or at least app didn't crash; do not assert dismissal behavior
  expect(screen.getByRole('status')).toBeInTheDocument();
});

describe('filtering and searching', () => {
  it('filters by status and search term', async () => {
    const user = userEvent.setup();
    render(<App />);

    await addTask(user, { title: 'Buy milk', description: 'Grocery' });
    await addTask(user, { title: 'Pay rent', description: 'Bills' });
    await addTask(user, { title: 'Book flight', description: 'Travel' });

    // Mark "Pay rent" completed (supports checkbox/toggle)
    const rentItem = getTaskItemByTitle('Pay rent');
    const statusToggle =
      within(rentItem).queryByRole('checkbox') ??
      within(rentItem).queryByRole('switch') ??
      within(rentItem).queryByRole('button', { name: /complete|done|mark/i });

    if (!statusToggle) {
      throw new Error('Could not find a control to toggle task completion status for "Pay rent"');
    }
    await user.click(statusToggle);

    // Filter to Completed
    const statusFilter =
      screen.queryByRole('combobox', { name: /status/i }) ??
      screen.queryByRole('radiogroup', { name: /status/i }) ??
      screen.queryByRole('group', { name: /status/i });

    if (statusFilter) {
      const combo = within(statusFilter).queryByRole('combobox') ?? (statusFilter.getAttribute('role') === 'combobox' ? statusFilter : null);
      if (combo) {
        await user.selectOptions(combo, ['completed']);
      } else {
        const completedRadio =
          within(statusFilter).queryByRole('radio', { name: /completed/i }) ??
          within(statusFilter).queryByRole('button', { name: /completed/i });
        if (!completedRadio) throw new Error('Could not find Completed option in status filter');
        await user.click(completedRadio);
      }
    } else {
      const combo = screen.queryByRole('combobox');
      if (!combo) throw new Error('Could not find status filter control');
      await user.selectOptions(combo, ['completed']);
    }

    expect(screen.getByText('Pay rent')).toBeInTheDocument();
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    expect(screen.queryByText('Book flight')).not.toBeInTheDocument();

    // Search within completed (search for "pay")
    const searchInput =
      screen.queryByRole('searchbox', { name: /search/i }) ??
      screen.queryByRole('textbox', { name: /search/i }) ??
      screen.getByPlaceholderText(/search/i);

    await user.clear(searchInput);
    await user.type(searchInput, 'pay');

    expect(screen.getByText('Pay rent')).toBeInTheDocument();

    await user.clear(searchInput);
    await user.type(searchInput, 'milk');

    expect(screen.queryByText('Pay rent')).not.toBeInTheDocument();
  });
});

it('edits a task (title and description)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, { title: 'Old title', description: 'Old description' });

  const { editButton } = getTaskControls('Old title');
  await user.click(editButton);

  const titleInput = screen.getByLabelText(/title/i);
  const descriptionInput = screen.getByLabelText(/description/i);

  await user.clear(titleInput);
  await user.type(titleInput, 'New title');
  await user.clear(descriptionInput);
  await user.type(descriptionInput, 'New description');

  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByText('New title')).toBeInTheDocument();
  expect(screen.getByText('New description')).toBeInTheDocument();
  expect(screen.queryByText('Old title')).not.toBeInTheDocument();
  expect(screen.queryByText('Old description')).not.toBeInTheDocument();
});

it('deletes a task after confirmation', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);

  await addTask(user, { title: 'Temp', description: 'To be removed' });

  const { deleteButton } = getTaskControls('Temp');
  await user.click(deleteButton);

  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
  expect(screen.queryByText('To be removed')).not.toBeInTheDocument();
});
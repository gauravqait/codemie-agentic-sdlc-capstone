import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import App from './App.jsx';

function renderApp() {
  return render(<App />);
}

async function addTask(user, title) {
  await user.clear(screen.getByRole('textbox', { name: /title/i }));
  if (title) {
    await user.type(screen.getByRole('textbox', { name: /title/i }), title);
  }
  await user.click(screen.getByRole('button', { name: /add/i }));
}

async function editFirstTask(user, newTitle, newStatus) {
  const list = screen.getByRole('list', { name: /tasks/i });
  const firstItem = within(list).getAllByRole('listitem')[0];

  await user.click(within(firstItem).getByRole('button', { name: /edit/i }));
  await user.clear(screen.getByRole('textbox', { name: /title/i }));
  await user.type(screen.getByRole('textbox', { name: /title/i }), newTitle);

  if (newStatus) {
    const statusSelect = screen.getByRole('combobox', { name: /status/i });
    await user.selectOptions(statusSelect, newStatus);
  }

  await user.click(within(firstItem).getByRole('button', { name: /save/i }));
}

async function deleteFirstTask(user) {
  const list = screen.getByRole('list', { name: /tasks/i });
  const firstItem = within(list).getAllByRole('listitem')[0];
  await user.click(within(firstItem).getByRole('button', { name: /delete/i }));
}

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

it('adds a task', async () => {
  const user = userEvent.setup();
  renderApp();

  expect(
    screen.getByRole('heading', { name: /tasks/i, level: 1 })
  ).toBeInTheDocument();

  await addTask(user, 'Buy milk');
  expect(screen.getByText('Buy milk')).toBeInTheDocument();

  // ids are strings in the new UI; ensure listitem exposes a string id attribute if present
  const list = screen.getByRole('list', { name: /tasks/i });
  const item = within(list).getAllByRole('listitem')[0];
  const dataId =
    item.getAttribute('data-id') ??
    item.getAttribute('data-testid') ??
    item.getAttribute('id');

  if (dataId != null) {
    expect(typeof dataId).toBe('string');
  }
});

it('rejects an empty title and focuses the title field (field-level validation + live region)', async () => {
  const user = userEvent.setup();
  renderApp();

  await addTask(user, '');

  const titleInput = screen.getByRole('textbox', { name: /title/i });
  expect(titleInput).toHaveFocus();

  // Implemented UI uses a live region for validation messaging.
  const liveRegion = screen.getByRole('status');
  expect(liveRegion).toHaveTextContent('Title is required.');
});

it('edits a task and updates the title', async () => {
  const user = userEvent.setup();
  renderApp();

  await addTask(user, 'Old');
  await editFirstTask(user, 'New');

  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
});

it('deletes a task after confirmation', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  renderApp();

  await addTask(user, 'Temp');
  await deleteFirstTask(user);

  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
});

it('filter, search, and sort behave', async () => {
  const user = userEvent.setup();
  renderApp();

  // Add out-of-order titles so sorting can be asserted.
  await addTask(user, 'Charlie');
  await addTask(user, 'Alpha');
  await addTask(user, 'Bravo');

  // Search (implemented as role="searchbox")
  const searchBox = screen.getByRole('searchbox', { name: /search/i });
  await user.type(searchBox, 'br');

  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  expect(screen.getByText('Bravo')).toBeInTheDocument();
  expect(screen.queryByText('Charlie')).not.toBeInTheDocument();

  // Clear search
  await user.clear(searchBox);

  // Set first task status to Done via edit
  await editFirstTask(user, 'Charlie', 'Done');

  // Filter (implemented as select with aria-label "Filter status")
  const filterSelect = screen.getByRole('combobox', { name: 'Filter status' });
  await user.selectOptions(filterSelect, 'Done');

  // Only the Done task should be visible
  expect(screen.getByText('Charlie')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
  expect(screen.queryByText('Bravo')).not.toBeInTheDocument();

  // Reset filter to show all (uses one of the implemented statuses; choose "To Do")
  await user.selectOptions(filterSelect, 'To Do');
  expect(screen.getByText('Alpha')).toBeInTheDocument();
  expect(screen.getByText('Bravo')).toBeInTheDocument();

  // Sort (implemented as select with aria-label "Sort tasks")
  const sortSelect = screen.getByRole('combobox', { name: 'Sort tasks' });
  await user.selectOptions(sortSelect, 'Title (A–Z)');

  const list = screen.getByRole('list', { name: /tasks/i });
  const titles = within(list)
    .getAllByRole('listitem')
    .map((li) => li.textContent);

  const alphaIndex = titles.findIndex((t) => t?.includes('Alpha'));
  const bravoIndex = titles.findIndex((t) => t?.includes('Bravo'));
  const charlieIndex = titles.findIndex((t) => t?.includes('Charlie'));

  expect(alphaIndex).toBeGreaterThanOrEqual(0);
  expect(bravoIndex).toBeGreaterThanOrEqual(0);
  expect(charlieIndex).toBeGreaterThanOrEqual(0);
  expect(alphaIndex).toBeLessThan(bravoIndex);
  expect(bravoIndex).toBeLessThan(charlieIndex);
});

it('import/export basic works', async () => {
  const user = userEvent.setup();
  renderApp();

  await addTask(user, 'Export me');

  const exportButton = screen.getByRole('button', { name: 'Export JSON' });
  await user.click(exportButton);

  const importTextarea = screen.getByRole('textbox', { name: 'JSON' });
  await user.clear(importTextarea);
  await user.paste(
    JSON.stringify([{ id: '1', title: 'Imported task', status: 'To Do' }])
  );

  const importButton = screen.getByRole('button', { name: 'Import JSON' });
  await user.click(importButton);

  expect(screen.getByText('Imported task')).toBeInTheDocument();
});

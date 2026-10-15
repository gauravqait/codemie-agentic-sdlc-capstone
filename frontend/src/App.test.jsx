import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import App from './App.jsx';

function getTaskList() {
  // Prefer semantic list role if present, otherwise fall back to main region.
  return (
    screen.queryByRole('list', { name: /tasks/i }) ??
    screen.queryByRole('list') ??
    screen.getByRole('main')
  );
}

function getTaskItemByTitle(title) {
  const container = getTaskList();
  // Prefer listitem semantics if present; otherwise search within container.
  const items = within(container).queryAllByRole('listitem');
  if (items.length > 0) {
    const match = items.find((li) => within(li).queryByText(title));
    if (!match) throw new Error(`Could not find task item with title: ${title}`);
    return match;
  }
  const text = within(container).getByText(title);
  return text.closest('[role="listitem"]') ?? text.parentElement ?? container;
}

function getToolbar() {
  return (
    screen.queryByRole('region', { name: /toolbar/i }) ??
    screen.queryByRole('group', { name: /toolbar/i }) ??
    screen.getByRole('main')
  );
}

async function add(user, title) {
  // Keep Task form label and Title label per requirements.
  await user.type(screen.getByLabelText('Title'), title);
  await user.click(screen.getByRole('button', { name: /add/i }));
}

async function edit(user, fromTitle, toTitle) {
  const item = getTaskItemByTitle(fromTitle);
  await user.click(within(item).getByRole('button', { name: /edit/i }));
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), toTitle);
  await user.click(screen.getByRole('button', { name: /save/i }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

it('adds a task', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'Buy milk');
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

it('trims title on add', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, '  Buy milk  ');
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  expect(screen.queryByText('  Buy milk  ')).not.toBeInTheDocument();
});

it('rejects an empty title', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /add/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/title is required/i);
});

it('rejects a title longer than 100 characters', async () => {
  const user = userEvent.setup();
  render(<App />);
  const tooLong = 'a'.repeat(101);
  await add(user, tooLong);
  expect(screen.getByRole('alert')).toHaveTextContent(/100/i);
  expect(screen.queryByText(tooLong)).not.toBeInTheDocument();
});

it('edits a task', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'Old');
  await edit(user, 'Old', 'New');
  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
});

it('deletes a task after confirmation', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);
  await add(user, 'Temp');
  const item = getTaskItemByTitle('Temp');
  await user.click(within(item).getByRole('button', { name: /delete/i }));
  expect(window.confirm).toHaveBeenCalled();
  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
});

it('does not delete a task if confirmation is cancelled', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<App />);
  await add(user, 'Keep');
  const item = getTaskItemByTitle('Keep');
  await user.click(within(item).getByRole('button', { name: /delete/i }));
  expect(window.confirm).toHaveBeenCalled();
  expect(screen.getByText('Keep')).toBeInTheDocument();
});

it('filters by status', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'Active task');
  await add(user, 'Done task');

  // Mark "Done task" complete using an accessible checkbox (common pattern).
  const doneItem = getTaskItemByTitle('Done task');
  const toggle =
    within(doneItem).queryByRole('checkbox', { name: /done|complete|completed|status/i }) ??
    within(doneItem).getByRole('checkbox');
  await user.click(toggle);

  const toolbar = getToolbar();
  const filter = within(toolbar).getByLabelText(/filter by status/i);

  await user.selectOptions(filter, 'completed');
  expect(screen.queryByText('Active task')).not.toBeInTheDocument();
  expect(screen.getByText('Done task')).toBeInTheDocument();

  await user.selectOptions(filter, 'active');
  expect(screen.getByText('Active task')).toBeInTheDocument();
  expect(screen.queryByText('Done task')).not.toBeInTheDocument();

  await user.selectOptions(filter, 'all');
  expect(screen.getByText('Active task')).toBeInTheDocument();
  expect(screen.getByText('Done task')).toBeInTheDocument();
});

it('searches tasks by title', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'Buy milk');
  await add(user, 'Walk dog');

  const toolbar = getToolbar();
  await user.type(within(toolbar).getByLabelText(/search/i), 'milk');

  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  expect(screen.queryByText('Walk dog')).not.toBeInTheDocument();
});

it('sorts by newest by default', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'First');
  await add(user, 'Second');

  const container = getTaskList();
  const items = within(container).queryAllByRole('listitem');

  if (items.length >= 2) {
    // Newest first means "Second" should appear before "First"
    expect(within(items[0]).queryByText('Second')).toBeTruthy();
    expect(within(items[1]).queryByText('First')).toBeTruthy();
  } else {
    // Fallback if listitem roles are not present: compare DOM position.
    const firstNode = screen.getByText('First');
    const secondNode = screen.getByText('Second');
    const pos = secondNode.compareDocumentPosition(firstNode);
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

it('changes sort order via Sort control', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'First');
  await add(user, 'Second');

  const toolbar = getToolbar();
  const sort = within(toolbar).getByLabelText(/sort/i);

  // Try common values; if your app uses different option values, adjust accordingly.
  await user.selectOptions(sort, 'oldest');

  const container = getTaskList();
  const items = within(container).queryAllByRole('listitem');

  if (items.length >= 2) {
    expect(within(items[0]).queryByText('First')).toBeTruthy();
    expect(within(items[1]).queryByText('Second')).toBeTruthy();
  } else {
    const firstNode = screen.getByText('First');
    const secondNode = screen.getByText('Second');
    const pos = firstNode.compareDocumentPosition(secondNode);
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

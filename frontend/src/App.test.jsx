import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import App from './App';

function getFilterSection() {
  return screen.getByLabelText('Task filters');
}

function getFilterStatusControl() {
  // Status exists in both the form and filters; filters is the second instance.
  return screen.getAllByLabelText('Status')[1];
}

function getFormStatusControl() {
  // Status exists in both the form and filters; form is the first instance.
  return screen.getAllByLabelText('Status')[0];
}

function getFilterSearchControl() {
  // Ensure we target the filter UI for the Search input (and that it is uniquely labeled).
  return within(getFilterSection()).getByLabelText('Search');
}

async function add(user, { title, description, status } = {}) {
  const titleControl = screen.getByLabelText('Title');
  const descriptionControl = screen.getByLabelText('Description');

  // Always clear fields first to keep helper robust across successive calls.
  await user.clear(titleControl);
  await user.clear(descriptionControl);

  if (title != null) {
    await user.type(titleControl, title);
  }
  if (description != null) {
    // Clearing by label should already match the textarea; we keep using the labeled control.
    await user.type(descriptionControl, description);
  }
  if (status != null) {
    await user.selectOptions(getFormStatusControl(), status);
  }
  await user.click(screen.getByRole('button', { name: 'Add' }));
}

it('adds a task', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, { title: 'Buy milk' });
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

it('rejects an empty title (field-level error)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Add' }));

  expect(screen.getByRole('alert')).toHaveTextContent('Title is required.');
  expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
});

it('edits a task', async () => {
  const user = userEvent.setup();
  render(<App />);

  await add(user, { title: 'Old' });

  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), 'New');
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
});

it('cancel edit does not mutate the list', async () => {
  const user = userEvent.setup();
  render(<App />);

  await add(user, { title: 'Original' });

  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), 'Changed');
  await user.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(screen.getByText('Original')).toBeInTheDocument();
  expect(screen.queryByText('Changed')).not.toBeInTheDocument();
});

it('deletes a task after confirmation', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);

  await add(user, { title: 'Temp' });

  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
});

it('filters by status (task filters section)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await add(user, { title: 'Task A', description: 'alpha', status: 'To Do' });
  await add(user, { title: 'Task B', description: 'beta', status: 'Done' });

  // Verify we scope to the filter UI (but still use explicit control getter due to label ambiguity).
  const filters = within(getFilterSection());
  expect(filters.getByLabelText('Status')).toBeInTheDocument();

  await user.selectOptions(getFilterStatusControl(), 'Done');

  expect(screen.getByText('Task B')).toBeInTheDocument();
  expect(screen.queryByText('Task A')).not.toBeInTheDocument();
});

it('filters by search query (matches description)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await add(user, { title: 'One', description: 'contains zebra', status: 'To Do' });
  await add(user, { title: 'Two', description: 'contains lion', status: 'To Do' });

  await user.type(getFilterSearchControl(), 'zebra');

  expect(screen.getByText('One')).toBeInTheDocument();
  expect(screen.queryByText('Two')).not.toBeInTheDocument();
});

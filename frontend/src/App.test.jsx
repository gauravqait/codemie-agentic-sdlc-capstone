import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import App from './App.jsx';

function getFilterSection() {
  return screen.getByLabelText('Task filters');
}

function getFilterStatusControl() {
  // Status exists in both the form and filters; filters is the second instance.
  return screen.getAllByLabelText('Status')[1];
}

async function add(user, { title, description, status } = {}) {
  if (title != null) {
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), title);
  }
  if (description != null) {
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), description);
  }
  if (status != null) {
    await user.selectOptions(screen.getAllByLabelText('Status')[0], status);
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

  await add(user, { title: 'Task A', description: 'alpha', status: 'Open' });
  await add(user, { title: 'Task B', description: 'beta', status: 'Done' });

  const filters = within(getFilterSection());
  // Verify we scope to the filter UI (but still use explicit control getter due to label ambiguity).
  expect(filters.getByText(/status/i)).toBeInTheDocument();

  await user.selectOptions(getFilterStatusControl(), 'Done');

  expect(screen.getByText('Task B')).toBeInTheDocument();
  expect(screen.queryByText('Task A')).not.toBeInTheDocument();
});

it('filters by search query (matches description)', async () => {
  const user = userEvent.setup();
  render(<App />);

  await add(user, { title: 'One', description: 'contains zebra', status: 'Open' });
  await add(user, { title: 'Two', description: 'contains lion', status: 'Open' });

  const filters = within(getFilterSection());
  await user.type(filters.getByLabelText('Search'), 'zebra');

  expect(screen.getByText('One')).toBeInTheDocument();
  expect(screen.queryByText('Two')).not.toBeInTheDocument();
});

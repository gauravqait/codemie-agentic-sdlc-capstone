import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import App from './App.jsx';

async function addTask(user, title, { description, status } = {}) {
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), title);

  if (typeof description === 'string') {
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), description);
  }

  if (status) {
    await user.selectOptions(screen.getByLabelText('Status'), status);
  }

  await user.click(screen.getByRole('button', { name: 'Add' }));
}

it('adds a task and trims the title', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, '  Buy milk  ');
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

it('rejects an empty title and focuses Title input', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: 'Add' }));

  expect(screen.getByRole('alert')).toHaveTextContent('Title is required.');
  expect(screen.getByLabelText('Title')).toHaveFocus();
});

it('focuses Title after successful add', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'One');
  expect(screen.getByLabelText('Title')).toHaveFocus();
});

it('edits a task', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Old');

  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), 'New');
  await user.click(screen.getByRole('button', { name: 'Save' }));

  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
});

it('deletes a task after confirmation', async () => {
  const user = userEvent.setup();
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

  render(<App />);
  await addTask(user, 'Temp');

  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(screen.queryByText('Temp')).not.toBeInTheDocument();

  confirmSpy.mockRestore();
});

it('filters by status', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'A', { status: 'To Do' });
  await addTask(user, 'B', { status: 'Done' });

  await user.selectOptions(screen.getByLabelText('Filter by status'), 'Done');

  expect(screen.getByText('B')).toBeInTheDocument();
  expect(screen.queryByText('A')).not.toBeInTheDocument();
});

it('searches by title and description', async () => {
  const user = userEvent.setup();
  render(<App />);

  await addTask(user, 'Reset password', { description: 'User cannot login' });
  await addTask(user, 'Buy milk', { description: 'Groceries' });

  await user.type(screen.getByLabelText('Search'), 'login');

  expect(screen.getByText('Reset password')).toBeInTheDocument();
  expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
});

it('migrates legacy localStorage array to versioned envelope', async () => {
  const legacy = [{ id: 1, title: 'Legacy', description: '', status: 'To Do' }];
  localStorage.setItem('tasks', JSON.stringify(legacy));

  const user = userEvent.setup();
  render(<App />);

  expect(screen.getByText('Legacy')).toBeInTheDocument();

  // Trigger a state change to ensure saveTasks runs (effect runs after render anyway)
  await user.type(screen.getByLabelText('Search'), '');

  const saved = JSON.parse(localStorage.getItem('tasks'));
  expect(saved).toMatchObject({ version: 1 });
  expect(Array.isArray(saved.tasks)).toBe(true);
  expect(saved.tasks[0]).toMatchObject({ title: 'Legacy', status: 'To Do' });
});
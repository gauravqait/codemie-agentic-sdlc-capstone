import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import App from './App.jsx';

async function add(user, title) {
  await user.type(screen.getByLabelText('Title'), title);
  await user.click(screen.getByRole('button', { name: 'Add' }));
}

it('adds a task', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'Buy milk');
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
});

it('rejects an empty title', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Add' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Title is required.');
});

it('edits a task', async () => {
  const user = userEvent.setup();
  render(<App />);
  await add(user, 'Old');
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.clear(screen.getByLabelText('Title'));
  await user.type(screen.getByLabelText('Title'), 'New');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.queryByText('Old')).not.toBeInTheDocument();
});

it('deletes a task after confirmation', async () => {
  const user = userEvent.setup();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<App />);
  await add(user, 'Temp');
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  expect(screen.queryByText('Temp')).not.toBeInTheDocument();
});

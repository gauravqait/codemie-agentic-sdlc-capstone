import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { STORAGE_KEY } from './domain/constants';

async function addTask(user, title, description = '') {
  const form = screen.getByRole('region', { name: /add a task/i });
  await user.type(within(form).getByLabelText('Title'), title);
  if (description) await user.type(within(form).getByLabelText(/description/i), description);
  await user.click(within(form).getByRole('button', { name: /add task/i }));
}

describe('App', () => {
  it('shows the empty state when there are no tasks', () => {
    render(<App />);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('shows a friendly message and does not crash on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{oops');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent(/corrupted/i);
    expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
  });

  it('creates a task and persists it with timestamps', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Write tests');
    expect(screen.getByRole('heading', { name: 'Write tests' })).toBeInTheDocument();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved[0].createdAt).toBeTruthy();
    expect(saved[0].updatedAt).toBe(saved[0].createdAt);
  });

  it('blocks an invalid title with an accessible error', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, '  ');
    const input = screen.getByLabelText('Title');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/required/i);
    expect(input).toHaveFocus();
    expect(screen.queryByRole('list', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('applies the same validation when editing', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Original');
    await user.click(screen.getByRole('button', { name: 'Edit Original' }));
    const input = screen.getAllByLabelText('Title')[1];
    await user.clear(input);
    await user.type(input, 'ab');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(input).toHaveAccessibleDescription(/at least 3/);
  });

  it('searches by title and description and filters by status', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Buy milk', 'from the store');
    await addTask(user, 'Walk dog');
    const search = screen.getByLabelText(/search tasks/i);

    await user.type(search, 'STORE');
    expect(screen.getByRole('heading', { name: 'Buy milk' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Walk dog' })).not.toBeInTheDocument();

    await user.clear(search);
    await user.selectOptions(screen.getByLabelText(/filter by status/i), 'done');
    expect(screen.getByText(/no tasks match/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /reset search and filter/i }));
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('confirms before deleting, supports Esc to cancel and restores focus', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Delete me');
    const del = screen.getByRole('button', { name: 'Delete Delete me' });
    await user.click(del);

    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(del).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Delete me' })).toBeInTheDocument();
  });

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Trap test');
    await user.click(screen.getByRole('button', { name: 'Delete Trap test' }));
    const dialog = screen.getByRole('alertdialog');
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Delete' })).toHaveFocus();
    await user.tab();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('deletes after confirmation and moves focus to the next task', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'First task');
    await addTask(user, 'Second task'); // newest is listed first
    await user.click(screen.getByRole('button', { name: 'Delete Second task' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    expect(screen.queryByRole('heading', { name: 'Second task' })).not.toBeInTheDocument();
    await screen.findByRole('button', { name: 'Edit First task' });
    expect(screen.getByRole('button', { name: 'Edit First task' })).toHaveFocus();
  });

  it('updates updatedAt but keeps createdAt on edit', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Before');
    const before = JSON.parse(localStorage.getItem(STORAGE_KEY))[0];
    await new Promise((r) => setTimeout(r, 5));
    await user.click(screen.getByRole('button', { name: 'Edit Before' }));
    const input = screen.getAllByLabelText('Title')[1];
    await user.clear(input);
    await user.type(input, 'After');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    const after = JSON.parse(localStorage.getItem(STORAGE_KEY))[0];
    expect(after.title).toBe('After');
    expect(after.createdAt).toBe(before.createdAt);
    expect(after.updatedAt).not.toBe(before.updatedAt);
  });
});

describe('ErrorBoundary', () => {
  it('renders a friendly fallback when a child throws', () => {
    const Boom = () => { throw new Error('boom'); };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
    spy.mockRestore();
  });
});

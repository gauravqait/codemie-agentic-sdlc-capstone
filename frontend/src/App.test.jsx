import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { UNDO_WINDOW_MS } from './components/UndoSnackbar';
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

  it('deletes immediately and shows an undo snackbar', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Delete me');
    await user.click(screen.getByRole('button', { name: 'Delete Delete me' }));
    expect(screen.queryByRole('heading', { name: 'Delete me' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toHaveLength(0);
  });

  it('restores the task at its original position and focuses it on undo', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'First task');
    await addTask(user, 'Second task'); // newest is listed first
    await addTask(user, 'Third task');
    await user.click(screen.getByRole('button', { name: 'Delete Second task' }));
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['Third task', 'Second task', 'First task']);
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Edit Second task' })).toHaveFocus());
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('makes the delete final once the undo window passes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<App />);
      await addTask(user, 'Gone for good');
      await user.click(screen.getByRole('button', { name: 'Delete Gone for good' }));
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS + 100);
      });
      expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Gone for good' })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('moves focus to the next task after deleting', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'First task');
    await addTask(user, 'Second task');
    await user.click(screen.getByRole('button', { name: 'Delete Second task' }));
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Edit First task' })).toHaveFocus());
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
  it('shows a dismissible banner when saving fails', async () => {
    const user = userEvent.setup();
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    render(<App />);
    await addTask(user, 'Cannot save');
    const banner = await screen.findByRole('alert');
    expect(banner).toHaveTextContent(/could not be saved/i);
    await user.click(within(banner).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText(/could not be saved/i)).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('announces add, update and delete in the live region', async () => {
    const user = userEvent.setup();
    render(<App />);
    const live = screen.getByRole('status');
    await addTask(user, 'Announce me');
    expect(live).toHaveTextContent('Task "Announce me" added.');

    await user.click(screen.getByRole('button', { name: 'Edit Announce me' }));
    const input = screen.getAllByLabelText('Title')[1];
    await user.clear(input);
    await user.type(input, 'Announced');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(live).toHaveTextContent('Task "Announced" updated.');

    await user.click(screen.getByRole('button', { name: 'Delete Announced' }));
    expect(live).toHaveTextContent('Task "Announced" deleted. Undo available.');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(live).toHaveTextContent('Task "Announced" restored.');
  });

  it('focuses the page heading after deleting the last task', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addTask(user, 'Only task');
    await user.click(screen.getByRole('button', { name: 'Delete Only task' }));
    await vi.waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
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

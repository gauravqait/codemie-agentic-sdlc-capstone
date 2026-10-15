import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from './TaskList';

describe('TaskList', () => {
  it('shows empty state when no tasks', () => {
    render(
      <TaskList
        tasks={[]}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText(/no tasks found/i)).toBeInTheDocument();
  });

  it('renders task list with tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', description: 'Desc 1', status: 'To Do', createdAt: Date.now() },
      { id: '2', title: 'Task 2', description: 'Desc 2', status: 'Done', createdAt: Date.now() },
    ];

    render(
      <TaskList
        tasks={tasks}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('(To Do)')).toBeInTheDocument();
    expect(screen.getByText('(Done)')).toBeInTheDocument();
  });

  it('renders task descriptions when present', () => {
    const tasks = [
      { id: '1', title: 'Task 1', description: 'Important task', status: 'To Do', createdAt: Date.now() },
    ];

    render(
      <TaskList
        tasks={tasks}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('Important task')).toBeInTheDocument();
  });

  it('calls onEdit with task when edit button clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const tasks = [
      { id: '1', title: 'Task 1', description: '', status: 'To Do', createdAt: Date.now() },
    ];

    render(
      <TaskList
        tasks={tasks}
        onEdit={onEdit}
        onDelete={() => {}}
      />
    );

    await user.click(screen.getByRole('button', { name: /edit task 1/i }));
    expect(onEdit).toHaveBeenCalledWith(tasks[0]);
  });

  it('calls onDelete with task when delete button clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    const tasks = [
      { id: '1', title: 'Task 1', description: '', status: 'To Do', createdAt: Date.now() },
    ];

    render(
      <TaskList
        tasks={tasks}
        onEdit={() => {}}
        onDelete={onDelete}
      />
    );

    await user.click(screen.getByRole('button', { name: /delete task 1/i }));
    expect(onDelete).toHaveBeenCalledWith(tasks[0]);
  });
});

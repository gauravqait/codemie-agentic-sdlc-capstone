import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from './TaskForm';
import { ALLOWED_STATUSES } from '../domain/constants';

describe('TaskForm', () => {
  const baseForm = { title: '', description: '', status: ALLOWED_STATUSES[0] };

  it('renders form fields with correct labels', () => {
    render(
      <TaskForm
        form={baseForm}
        onFormChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        isEditing={false}
      />
    );

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
  });

  it('shows Add Task button in create mode', () => {
    render(
      <TaskForm
        form={baseForm}
        onFormChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        isEditing={false}
      />
    );

    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
  });

  it('shows Save Changes and Cancel in edit mode', () => {
    render(
      <TaskForm
        form={baseForm}
        onFormChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        isEditing={true}
      />
    );

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onFormChange when typing in title', async () => {
    const user = userEvent.setup();
    const onFormChange = vi.fn();

    render(
      <TaskForm
        form={baseForm}
        onFormChange={onFormChange}
        onSubmit={() => {}}
        onCancel={() => {}}
        isEditing={false}
      />
    );

    await user.type(screen.getByLabelText(/title/i), 'New Title');
    expect(onFormChange).toHaveBeenCalled();
  });

  it('calls onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e) => e?.preventDefault?.());

    render(
      <TaskForm
        form={{ ...baseForm, title: 'Valid Title' }}
        onFormChange={() => {}}
        onSubmit={onSubmit}
        onCancel={() => {}}
        isEditing={false}
      />
    );

    const form = screen.getByLabelText(/task form/i);
    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(onSubmit).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <TaskForm
        form={baseForm}
        onFormChange={() => {}}
        onSubmit={() => {}}
        onCancel={onCancel}
        isEditing={true}
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('disables submit button when form is invalid', () => {
    render(
      <TaskForm
        form={baseForm}
        onFormChange={() => {}}
        onSubmit={() => {}}
        onCancel={() => {}}
        isEditing={false}
      />
    );

    const submitButton = screen.getByRole('button', { name: /add task/i });
    expect(submitButton).toBeDisabled();
  });
});

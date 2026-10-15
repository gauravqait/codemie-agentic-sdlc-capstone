import { describe, expect, it } from 'vitest';
import { validateTaskInput } from '../domain/validate';

describe('validateTaskInput', () => {
  it('requires title', () => {
    const res = validateTaskInput({ title: '  ', description: '', status: 'To Do' });
    expect(res.valid).toBe(false);
    expect(res.errors.title).toMatch(/required/i);
  });

  it('accepts valid input', () => {
    const res = validateTaskInput({ title: 'A', description: 'B', status: 'Done' });
    expect(res.valid).toBe(true);
  });
});

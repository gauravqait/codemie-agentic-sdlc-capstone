import { describe, it, expect } from 'vitest';
import { validateTask } from './validation';
import { ALLOWED_STATUSES } from './constants';

describe('validateTask', () => {
  it('accepts a valid task', () => {
    const input = { title: 'My Task', description: 'Desc', status: ALLOWED_STATUSES[0] };
    const result = validateTask(input);
    expect(result).toEqual({ isValid: true, errors: {} });
  });

  it('rejects missing/empty title', () => {
    const input = { title: '', description: 'Desc', status: ALLOWED_STATUSES[0] };
    const result = validateTask(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('title');
  });

  it('rejects whitespace-only title', () => {
    const input = { title: '   ', description: 'Desc', status: ALLOWED_STATUSES[0] };
    const result = validateTask(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('title');
  });

  it('rejects invalid status', () => {
    const input = { title: 'Ok', description: 'Desc', status: 'INVALID' };
    const result = validateTask(input);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveProperty('status');
  });
});

import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('returns unique ids across multiple calls', () => {
    const ids = new Set();
    for (let i = 0; i < 200; i++) ids.add(generateId());
    expect(ids.size).toBe(200);
  });
});

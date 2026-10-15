import { describe, expect, it } from 'vitest';
import { LIMITS, validateTask } from './validation.js';

describe('validateTask', () => {
  it('requires non-empty trimmed title', () => {
    expect(validateTask({ title: '' })).toMatchObject({ title: 'Title is required.' });
    expect(validateTask({ title: '   ' })).toMatchObject({ title: 'Title is required.' });
  });

  it('enforces title max length', () => {
    const title = 'a'.repeat(LIMITS.titleMax + 1);
    expect(validateTask({ title })).toMatchObject({
      title: `Title must be ${LIMITS.titleMax} characters or fewer.`,
    });
  });

  it('enforces description max length', () => {
    const description = 'a'.repeat(LIMITS.descriptionMax + 1);
    expect(validateTask({ title: 'Ok', description })).toMatchObject({
      description: `Description must be ${LIMITS.descriptionMax} characters or fewer.`,
    });
  });
});

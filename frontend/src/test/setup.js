import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { randomUUID } from 'crypto';

beforeEach(() => {
  localStorage.clear();

  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true });
  }

  if (typeof globalThis.crypto.randomUUID !== 'function') {
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: vi.fn(() => randomUUID()),
      configurable: true,
    });
  }
});

afterEach(() => cleanup());
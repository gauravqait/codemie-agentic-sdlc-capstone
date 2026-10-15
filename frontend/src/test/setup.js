import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear();

  // jsdom may not provide crypto.randomUUID; provide a deterministic mock for tests.
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, 'crypto', {
      value: {},
      configurable: true,
    });
  }

  if (!('randomUUID' in globalThis.crypto)) {
    let counter = 0;

    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: vi.fn(() => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`),
      configurable: true,
    });
  }
});

afterEach(() => cleanup());

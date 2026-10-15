import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STORAGE_KEY, getItem, setItem, removeItem } from './storageAdapter';

const makeLocalStorageMock = () => {
  let store = new Map();
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    clear: vi.fn(() => store.clear()),
  };
};

describe('storageAdapter', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: makeLocalStorageMock(),
      configurable: true
    });
  });

  it('setItem/getItem roundtrip with default key', () => {
    const testData = { a: 1 };
    setItem(STORAGE_KEY, JSON.stringify(testData));

    const retrieved = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(retrieved)).toEqual(testData);
  });

  it('returns null when key is missing', () => {
    const value = getItem('nonexistent-key');
    expect(value).toBeNull();
  });

  it('removeItem removes the key', () => {
    setItem(STORAGE_KEY, JSON.stringify({ a: 1 }));
    removeItem(STORAGE_KEY);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('handles storage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    localStorage.setItem = vi.fn(() => {
      throw new Error('Storage full');
    });

    const result = setItem(STORAGE_KEY, 'test');
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

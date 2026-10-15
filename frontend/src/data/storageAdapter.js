/**
 * Storage adapter for localStorage operations
 * Isolates try/catch and key naming
 */

export const STORAGE_KEY = 'task-manager.tasks';

/**
 * Get item from localStorage
 * @param {string} key - Storage key (defaults to main tasks key)
 * @returns {string|null} Stored value or null
 */
export function getItem(key = STORAGE_KEY) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Set item in localStorage
 * @param {string} key - Storage key (defaults to main tasks key)
 * @param {string} value - Value to store
 * @returns {boolean} Success status
 */
export function setItem(key = STORAGE_KEY, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('Failed to write to localStorage:', error);
    return false;
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key (defaults to main tasks key)
 * @returns {boolean} Success status
 */
export function removeItem(key = STORAGE_KEY) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
    return false;
  }
}

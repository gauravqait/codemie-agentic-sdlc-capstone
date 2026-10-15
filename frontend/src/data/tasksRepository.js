import { getItem, setItem, STORAGE_KEY } from './storageAdapter.js';
import { generateId } from '../utils/id.js';
import { TASK_STATUS, ALLOWED_STATUSES } from '../domain/constants.js';
import { validateTask } from '../domain/validation.js';

const CURRENT_VERSION = 1;

/**
 * Tasks repository - handles CRUD operations with validation and migration
 */
class TasksRepository {
  /**
   * Load all tasks from storage with migration and normalization
   * @returns {Array} Array of tasks
   */
  getAll() {
    const raw = getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      const envelope = this._migrateToEnvelope(parsed);
      const normalized = this._normalizeTasks(envelope.tasks);

      // Write back if normalized differs
      if (JSON.stringify(normalized) !== JSON.stringify(envelope.tasks)) {
        this._saveEnvelope({ version: CURRENT_VERSION, tasks: normalized });
      }

      return normalized;
    } catch (error) {
      console.error('Failed to parse tasks from storage:', error);
      return [];
    }
  }

  /**
   * Create a new task
   * @param {Object} input - { title, description?, status? }
   * @returns {Object} Created task
   */
  create(input) {
    // Validate input
    const validation = validateTask(input);
    if (!validation.isValid) {
      throw new Error(`Invalid task: ${Object.values(validation.errors).join(', ')}`);
    }

    const tasks = this.getAll();
    const newTask = {
      id: generateId(),
      title: (input.title || '').trim(),
      description: input.description?.trim() || '',
      status: ALLOWED_STATUSES.includes(input.status) ? input.status : TASK_STATUS.TODO,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedTasks = [newTask, ...tasks];
    this._saveEnvelope({ version: CURRENT_VERSION, tasks: updatedTasks });
    return newTask;
  }

  /**
   * Update an existing task
   * @param {string} id - Task ID
   * @param {Object} patch - Partial task updates
   * @returns {Object|null} Updated task or null if not found
   */
  update(id, patch) {
    const tasks = this.getAll();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) return null;

    const updatedTask = {
      ...tasks[index],
      ...patch,
      id: tasks[index].id, // Preserve ID
      createdAt: tasks[index].createdAt, // Preserve creation time
      updatedAt: Date.now(),
    };

    // Trim strings if present
    if (typeof updatedTask.title === 'string') updatedTask.title = updatedTask.title.trim();
    if (typeof updatedTask.description === 'string') updatedTask.description = updatedTask.description.trim();

    // Validate and enforce status
    if (!ALLOWED_STATUSES.includes(updatedTask.status)) {
      updatedTask.status = TASK_STATUS.TODO;
    }

    // Validate updated task
    const validation = validateTask(updatedTask);
    if (!validation.isValid) {
      throw new Error(`Invalid task update: ${Object.values(validation.errors).join(', ')}`);
    }

    const updatedTasks = [...tasks];
    updatedTasks[index] = updatedTask;

    this._saveEnvelope({ version: CURRENT_VERSION, tasks: updatedTasks });
    return updatedTask;
  }

  /**
   * Remove a task
   * @param {string} id - Task ID
   * @returns {boolean} Success status
   */
  remove(id) {
    const tasks = this.getAll();
    const filtered = tasks.filter((t) => t.id !== id);

    if (filtered.length === tasks.length) return false;

    this._saveEnvelope({ version: CURRENT_VERSION, tasks: filtered });
    return true;
  }

  /**
   * Migrate legacy formats to current envelope structure
   * @private
   */
  _migrateToEnvelope(parsed) {
    // If already an envelope with version
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'tasks' in parsed) {
      return parsed;
    }

    // Legacy format: plain array
    if (Array.isArray(parsed)) {
      return { version: CURRENT_VERSION, tasks: parsed };
    }

    // Corrupted or unknown format
    return { version: CURRENT_VERSION, tasks: [] };
  }

  /**
   * Normalize tasks to ensure required fields
   * @private
   */
  _normalizeTasks(tasks) {
    if (!Array.isArray(tasks)) return [];

    return tasks.map((task, index) => ({
      id: task.id || generateId(),
      title: task.title || 'Untitled',
      description: task.description || '',
      status: ALLOWED_STATUSES.includes(task.status) ? task.status : TASK_STATUS.TODO,
      createdAt: task.createdAt || Date.now() - index, // Ensure uniqueness
      updatedAt: task.updatedAt || task.createdAt || Date.now() - index,
    }));
  }

  /**
   * Save envelope to storage
   * @private
   */
  _saveEnvelope(envelope) {
    setItem(STORAGE_KEY, JSON.stringify(envelope));
  }
}

// Export singleton instance
export const tasksRepository = new TasksRepository();

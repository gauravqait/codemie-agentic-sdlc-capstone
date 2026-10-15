import { STATUSES } from './taskModel.js';

/**
 * @typedef {import('./taskModel.js').TaskStatus} TaskStatus
 *
 * @typedef {Object} TransitionResult
 * @property {boolean} allowed
 * @property {boolean=} requiresConfirm
 * @property {string=} reason
 */

/**
 * Rule: Done -> In Progress requires confirmation. All other transitions allowed.
 *
 * @param {TaskStatus} from
 * @param {TaskStatus} to
 * @returns {TransitionResult}
 */
export function checkTransition(from, to) {
  if (!STATUSES.includes(from) || !STATUSES.includes(to)) {
    return { allowed: false, reason: 'Invalid status.' };
  }
  if (from === to) return { allowed: true };
  if (from === 'Done' && to === 'In Progress') {
    return { allowed: true, requiresConfirm: true, reason: 'Reopen a done task?' };
  }
  return { allowed: true };
}

import { TITLE_MIN, TITLE_MAX } from './constants';

/** Returns an error message for an invalid title, or '' when valid. Title is trimmed first. */
export function validateTitle(title) {
  const value = String(title ?? '').trim();
  if (!value) return 'Title is required.';
  if (value.length < TITLE_MIN) return `Title must be at least ${TITLE_MIN} characters.`;
  if (value.length > TITLE_MAX) return `Title must be at most ${TITLE_MAX} characters.`;
  return '';
}

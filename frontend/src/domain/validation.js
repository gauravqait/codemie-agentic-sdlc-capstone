export const LIMITS = {
  titleMax: 80,
  descriptionMax: 280,
};

export function validateTask(values) {
  /** @type {{title?: string, description?: string}} */
  const errors = {};

  const rawTitle = values.title ?? '';
  const title = rawTitle.trim();

  if (!title) errors.title = 'Title is required.';
  else if (title.length > LIMITS.titleMax) {
    errors.title = `Title must be ${LIMITS.titleMax} characters or fewer.`;
  }

  const description = values.description ?? '';
  if (description.length > LIMITS.descriptionMax) {
    errors.description = `Description must be ${LIMITS.descriptionMax} characters or fewer.`;
  }

  return errors;
}

import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_TRANSITION'
  | 'INTERNAL_ERROR';

export interface ApiErrorEnvelope {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class InvalidTransitionError extends Error {
  constructor(message = 'Invalid status transition') {
    super(message);
    this.name = 'InvalidTransitionError';
  }
}

function zodToFields(err: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || 'root';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const body: ApiErrorEnvelope = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fields: zodToFields(err)
    };
    return res.status(400).json(body);
  }

  if (err instanceof NotFoundError) {
    const body: ApiErrorEnvelope = { code: 'NOT_FOUND', message: err.message };
    return res.status(404).json(body);
  }

  if (err instanceof InvalidTransitionError) {
    const body: ApiErrorEnvelope = { code: 'INVALID_TRANSITION', message: err.message };
    return res.status(400).json(body);
  }

  const body: ApiErrorEnvelope = { code: 'INTERNAL_ERROR', message: 'Unexpected error' };
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json(body);
}

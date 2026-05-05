/**
 * Global Express error-handling middleware implementing RFC 9457.
 * Must be registered AFTER all routes: app.use(problemDetailsHandler)
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  ProblemDetailsError,
  ValidationError,
  InternalServerError,
} from './errors';

interface ValidationLikeError extends Error {
  zodError?: z.ZodError;
  isValidation?: boolean;
}

export const problemDetailsHandler = (
  err: Error | ProblemDetailsError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Already a structured problem-details error
  if (err instanceof ProblemDetailsError) {
    res
      .status(err.status)
      .setHeader('Content-Type', 'application/problem+json')
      .json({ ...err.toJSON(), instance: req.originalUrl });
    return;
  }

  // Zod validation error surfaced from validateRequest middleware
  const validationLike = err as ValidationLikeError;
  if (validationLike.isValidation && validationLike.zodError) {
    const errors = validationLike.zodError.issues.map((e: z.ZodIssue) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    const problem = new ValidationError(errors);
    res
      .status(422)
      .setHeader('Content-Type', 'application/problem+json')
      .json({ ...problem.toJSON(), instance: req.originalUrl });
    return;
  }

  // Mongoose duplicate key error
  const mongoErr = err as Error & { code?: number };
  if (mongoErr.code === 11000) {
    res
      .status(409)
      .setHeader('Content-Type', 'application/problem+json')
      .json({
        type: 'https://problems.meeting-memory.app/conflict',
        title: 'Conflict',
        status: 409,
        detail: 'A resource with this value already exists',
        instance: req.originalUrl,
      });
    return;
  }

  // Unhandled/unknown error — log and return 500
  console.error('[UnhandledError]', err);
  const fallback = new InternalServerError(
    process.env['NODE_ENV'] === 'production' ? undefined : err.message
  );
  res
    .status(500)
    .setHeader('Content-Type', 'application/problem+json')
    .json({ ...fallback.toJSON(), instance: req.originalUrl });
};

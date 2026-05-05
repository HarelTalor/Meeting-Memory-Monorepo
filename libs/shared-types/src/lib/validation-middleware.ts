// ─── Middleware factory ────────────────────────────────────────────────────────
// Validates req.body / req.query / req.params against a Zod schema.
// On failure, throws a ValidationError that the global problem-details handler catches.

import type { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export type ZodTarget = 'body' | 'query' | 'params';

/**
 * Express middleware factory.
 * Usage: router.post('/...', validateRequest({ body: MySchema }), controller)
 */
export const validateRequest =
  (schemas: Partial<Record<ZodTarget, ZodSchema>>) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Re-throw as a structured ValidationError for the problem-details handler
        const validationErr = new Error('Validation failed') as Error & {
          zodError: z.ZodError;
          isValidation: true;
        };
        validationErr.zodError = err;
        validationErr.isValidation = true;
        next(validationErr);
      } else {
        next(err);
      }
    }
  };

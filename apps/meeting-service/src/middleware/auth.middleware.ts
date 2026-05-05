/**
 * Shared auth middleware for backend services.
 * Verifies the JWT access token passed by the API Gateway.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@mm/problem-details';

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
}

interface AccessTokenPayload {
  sub: string;
  email: string;
}

const ACCESS_TOKEN_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret-change-me';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
    (req as AuthRequest).userId = payload.sub;
    (req as AuthRequest).userEmail = payload.email;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid or expired access token'));
    }
  }
};

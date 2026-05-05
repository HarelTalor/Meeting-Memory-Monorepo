import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@mm/problem-details';

const ACCESS_TOKEN_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret-change-me';

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) throw new UnauthorizedError();
    jwt.verify(authHeader.slice(7), ACCESS_TOKEN_SECRET);
    next();
  } catch (err) {
    next(err instanceof UnauthorizedError ? err : new UnauthorizedError('Invalid or expired access token'));
  }
};

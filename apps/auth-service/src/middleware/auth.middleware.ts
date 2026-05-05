import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';
import { UnauthorizedError } from '@mm/problem-details';

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
}

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

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

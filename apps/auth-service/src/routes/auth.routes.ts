import { Router } from 'express';
import type { Redis } from 'ioredis';
import {
  register,
  login,
  refreshTokens,
  logout,
  getMe,
  updateMe,
  getAvatarUrl,
} from '../controllers/auth.controller';
import { validateRequest } from '@mm/shared-types';
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
} from '@mm/shared-types';
import { requireAuth } from '../middleware/auth.middleware';

export const createAuthRouter = (redis: Redis): Router => {
  const router = Router();

  // Public routes
  router.post('/auth/register', validateRequest({ body: RegisterSchema }), register(redis));
  router.post('/auth/login', validateRequest({ body: LoginSchema }), login(redis));
  router.post('/auth/refresh', refreshTokens(redis));
  router.post('/auth/logout', requireAuth, logout(redis));

  // Protected user routes
  router.get('/users/me', requireAuth, getMe);
  router.patch('/users/me', requireAuth, validateRequest({ body: UpdateProfileSchema }), updateMe);
  router.get('/users/me/avatar-upload-url', requireAuth, getAvatarUrl);

  return router;
};

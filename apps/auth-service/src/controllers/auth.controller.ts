import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/user.model';
import {
  generateTokenPair,
  validateRefreshToken,
  revokeRefreshToken,
} from '../services/token.service';
import { getAvatarUploadUrl } from '../services/s3.service';
import type { Redis } from 'ioredis';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '@mm/problem-details';
import type { RegisterDto, LoginDto, UpdateProfileDto } from '@mm/shared-types';

const BCRYPT_ROUNDS = 12;

// ─── Register ─────────────────────────────────────────────────────────────────

export const register =
  (redis: Redis) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, displayName } = req.body as RegisterDto;

      const existing = await UserModel.findOne({ email });
      if (existing) throw new ConflictError(`An account with email "${email}" already exists`);

      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await UserModel.create({ email, passwordHash, displayName });

      const tokens = await generateTokenPair(user.id as string, user.email, redis);

      res.status(201).json({ ...tokens, user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  };

// ─── Login ────────────────────────────────────────────────────────────────────

export const login =
  (redis: Redis) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body as LoginDto;

      const user = await UserModel.findOne({ email });
      if (!user) throw new UnauthorizedError('Invalid email or password');

      const valid = await user.comparePassword(password);
      if (!valid) throw new UnauthorizedError('Invalid email or password');

      const tokens = await generateTokenPair(user.id as string, user.email, redis);

      res.json({ ...tokens, user: user.toJSON() });
    } catch (err) {
      next(err);
    }
  };

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refreshTokens =
  (redis: Redis) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, refreshToken } = req.body as { userId: string; refreshToken: string };
      if (!userId || !refreshToken) throw new BadRequestError('userId and refreshToken are required');

      const isValid = await validateRefreshToken(userId, refreshToken, redis);
      if (!isValid) throw new UnauthorizedError('Invalid or expired refresh token');

      const user = await UserModel.findById(userId);
      if (!user) throw new NotFoundError('User', userId);

      const tokens = await generateTokenPair(user.id as string, user.email, redis);
      res.json(tokens);
    } catch (err) {
      next(err);
    }
  };

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logout =
  (redis: Redis) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as Request & { userId?: string }).userId;
      if (userId) {
        await revokeRefreshToken(userId, redis);
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

// ─── Get current user ─────────────────────────────────────────────────────────

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

// ─── Update profile ───────────────────────────────────────────────────────────

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as Request & { userId?: string }).userId;
    const update = req.body as UpdateProfileDto;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!user) throw new NotFoundError('User', userId);

    res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
};

// ─── Avatar upload URL ────────────────────────────────────────────────────────

export const getAvatarUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as Request & { userId?: string }).userId!;
    const ext = (req.query['ext'] as string) ?? 'jpg';
    const result = await getAvatarUploadUrl(userId, ext);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

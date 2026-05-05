import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AccessTokenPayload {
  sub: string;   // userId
  email: string;
  iat?: number;
  exp?: number;
}

const ACCESS_TOKEN_SECRET = process.env['JWT_ACCESS_SECRET'] ?? 'dev-access-secret-change-me';
const REFRESH_TOKEN_SECRET = process.env['JWT_REFRESH_SECRET'] ?? 'dev-refresh-secret-change-me';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export const generateTokenPair = async (
  userId: string,
  email: string,
  redis: Redis
): Promise<TokenPair> => {
  const accessToken = jwt.sign(
    { sub: userId, email } satisfies AccessTokenPayload,
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = randomUUID();

  // Store refresh token in Redis: key = `refresh:<userId>`, value = refreshToken
  await redis.set(`refresh:${userId}`, refreshToken, 'EX', REFRESH_TOKEN_TTL_SECONDS);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload;
};

export const validateRefreshToken = async (
  userId: string,
  refreshToken: string,
  redis: Redis
): Promise<boolean> => {
  const stored = await redis.get(`refresh:${userId}`);
  return stored === refreshToken;
};

export const revokeRefreshToken = async (userId: string, redis: Redis): Promise<void> => {
  await redis.del(`refresh:${userId}`);
};

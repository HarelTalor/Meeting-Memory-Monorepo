import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { problemDetailsHandler } from '@mm/problem-details';
import { createAuthRouter } from './routes/auth.routes';

export const createApp = (redis: Redis) => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200' }));
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'auth-service' }));

  // Routes
  app.use('/api', createAuthRouter(redis));

  // RFC 9457 error handler — must be last
  app.use(problemDetailsHandler);

  return app;
};

export const connectDb = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/meeting-memory';
  await mongoose.connect(uri);
  console.log('[auth-service] MongoDB connected');
};

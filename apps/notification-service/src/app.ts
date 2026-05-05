import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import { problemDetailsHandler } from '@mm/problem-details';
import { createNotificationRouter } from './routes/notification.routes';
import { startRedisSubscriber } from './services/redis-subscriber.service';
import { startDeadlineWatcher } from './services/deadline-watcher.service';

export const createApp = (redis: Redis) => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200' }));
  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
  app.use('/api', createNotificationRouter());
  app.use(problemDetailsHandler);
  return app;
};

export const connectDb = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/meeting-memory';
  await mongoose.connect(uri);
  console.log('[notification-service] MongoDB connected');
};

export const startBackgroundServices = (publisherRedis: Redis): void => {
  // Dedicated Redis connection for subscribe (cannot share with commands)
  const subscriberRedis = publisherRedis.duplicate();
  startRedisSubscriber(subscriberRedis);
  startDeadlineWatcher(publisherRedis);
};

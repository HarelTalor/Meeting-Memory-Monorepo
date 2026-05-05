import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { problemDetailsHandler } from '@mm/problem-details';
import { createTaskRouter } from './routes/task.routes';

export const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200' }));
  app.use(express.json({ limit: '1mb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'task-service' }));
  app.use('/api', createTaskRouter());
  app.use(problemDetailsHandler);
  return app;
};

export const connectDb = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/meeting-memory';
  await mongoose.connect(uri);
  console.log('[task-service] MongoDB connected');
};

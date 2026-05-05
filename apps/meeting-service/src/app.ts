import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { problemDetailsHandler } from '@mm/problem-details';
import { createMeetingRouter } from './routes/meeting.routes';

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200' }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'meeting-service' }));
  app.use('/api', createMeetingRouter());
  app.use(problemDetailsHandler);

  return app;
};

export const connectDb = async (): Promise<void> => {
  const uri = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/meeting-memory';
  await mongoose.connect(uri);
  console.log('[meeting-service] MongoDB connected');
};

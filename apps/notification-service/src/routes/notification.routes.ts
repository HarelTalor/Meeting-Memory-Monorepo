import { Router } from 'express';
import {
  streamNotifications,
  listNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const createNotificationRouter = (): Router => {
  const router = Router();
  router.use(requireAuth);
  router.get('/notifications/stream', streamNotifications);
  router.get('/notifications', listNotifications);
  router.patch('/notifications/read-all', markAllAsRead);
  router.patch('/notifications/:id/read', markAsRead);
  return router;
};

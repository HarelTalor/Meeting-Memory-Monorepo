import type { Request, Response, NextFunction } from 'express';
import { NotificationModel } from '../models/notification.model';
import { sseManager } from '../services/sse.manager';
import { NotFoundError } from '@mm/problem-details';
import { buildPaginationMeta, toSkip } from '@mm/shared-utils';
import type { AuthRequest } from '../middleware/auth.middleware';

// ─── SSE stream endpoint ──────────────────────────────────────────────────────

export const streamNotifications = (req: Request, res: Response): void => {
  const { userId } = req as AuthRequest;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx proxy buffer disable
  res.flushHeaders();

  // Send a heartbeat comment every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  // Register this connection
  sseManager.addConnection(userId, res);

  // Send any unread notifications immediately on connect
  NotificationModel.find({ recipientId: userId, read: false })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()
    .then((notifications) => {
      notifications.reverse().forEach((n) => {
        res.write(`event: ${n.type}\ndata: ${JSON.stringify(n)}\n\n`);
      });
    })
    .catch(console.error);

  // Cleanup on connection close
  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeConnection(userId, res);
  });
};

// ─── List notifications ───────────────────────────────────────────────────────

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const page = Number(req.query['page']) || 1;
    const limit = Number(req.query['limit']) || 20;
    const unreadOnly = req.query['unreadOnly'] === 'true';

    const filter: Record<string, unknown> = { recipientId: userId };
    if (unreadOnly) filter['read'] = false;

    const skip = toSkip(page, limit);
    const [data, total] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      NotificationModel.countDocuments(filter),
    ]);

    res.json(buildPaginationMeta(data, total, { page, limit }));
  } catch (err) {
    next(err);
  }
};

// ─── Mark notification as read ────────────────────────────────────────────────

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: req.params['id'], recipientId: userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) throw new NotFoundError('Notification', req.params['id']);
    res.json(notification.toJSON());
  } catch (err) {
    next(err);
  }
};

// ─── Mark all as read ─────────────────────────────────────────────────────────

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req as AuthRequest;
    await NotificationModel.updateMany({ recipientId: userId, read: false }, { $set: { read: true } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

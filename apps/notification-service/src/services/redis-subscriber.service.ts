/**
 * Redis Pub/Sub subscriber for the notification service.
 * Other services publish events to channels; this subscriber
 * receives them and fans them out via SSE.
 */

import { Redis } from 'ioredis';
import { NotificationModel } from '../models/notification.model';
import { sseManager } from './sse.manager';
import type { NotificationType } from '@mm/shared-types';

export const NOTIFICATION_CHANNEL = 'notifications';

export interface NotificationEvent {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}

export const startRedisSubscriber = (subscriberRedis: Redis): void => {
  subscriberRedis.subscribe(NOTIFICATION_CHANNEL, (err) => {
    if (err) {
      console.error('[notification-service] Redis subscribe error:', err);
    } else {
      console.log(`[notification-service] Subscribed to "${NOTIFICATION_CHANNEL}" channel`);
    }
  });

  subscriberRedis.on('message', async (_channel: string, rawMessage: string) => {
    try {
      const event: NotificationEvent = JSON.parse(rawMessage);

      // Persist notification to MongoDB
      const saved = await NotificationModel.create({
        recipientId: event.recipientId,
        type: event.type,
        title: event.title,
        message: event.message,
        payload: event.payload,
        read: false,
      });

      // Push over SSE to connected client (if online)
      sseManager.sendToUser(event.recipientId, {
        type: event.type,
        data: saved.toJSON(),
      });
    } catch (err) {
      console.error('[notification-service] Failed to process notification event:', err);
    }
  });
};

/**
 * Utility to publish notification events from any service.
 * Usage: publishNotification(redis, { recipientId, type, title, message, payload })
 */
export const publishNotification = async (
  redis: Redis,
  event: NotificationEvent
): Promise<void> => {
  await redis.publish(NOTIFICATION_CHANNEL, JSON.stringify(event));
};

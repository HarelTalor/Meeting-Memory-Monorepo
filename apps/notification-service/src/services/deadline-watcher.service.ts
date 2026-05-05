/**
 * Cron-based deadline watcher.
 * Runs every minute and sends notifications for:
 * - Tasks with deadlines within 24 hours (status != done)
 * - Meetings scheduled within 1 hour
 */

import cron from 'node-cron';
import mongoose from 'mongoose';
import { isWithinHours } from '@mm/shared-utils';
import { publishNotification } from './redis-subscriber.service';
import type { Redis } from 'ioredis';

export const startDeadlineWatcher = (redis: Redis): void => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const db = mongoose.connection.db;
      if (!db) return;

      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1h = new Date(now.getTime() + 60 * 60 * 1000);

      // ── Task deadline notifications ────────────────────────────────────────
      const tasks = await db.collection('tasks').find({
        status: { $ne: 'done' },
        deadline: { $gt: now, $lte: in24h },
        // Only notify once per task per day — use a notifiedAt field or just let it send
      }).toArray();

      for (const task of tasks) {
        if (!task['assigneeId']) continue;
        const hoursLeft = Math.round((new Date(task['deadline']).getTime() - now.getTime()) / (1000 * 60 * 60));
        await publishNotification(redis, {
          recipientId: task['assigneeId'].toString(),
          type: 'task_deadline',
          title: 'Task Deadline Approaching',
          message: `"${task['title']}" is due in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`,
          payload: { taskId: task['_id'].toString(), meetingId: task['meetingId']?.toString() },
        });
      }

      // ── Meeting reminder notifications ─────────────────────────────────────
      const meetings = await db.collection('meetings').find({
        status: 'scheduled',
        date: { $gt: now, $lte: in1h },
      }).toArray();

      for (const meeting of meetings) {
        const participants: Array<{ userId: { toString(): string } }> = meeting['participants'] ?? [];
        const minutesLeft = Math.round((new Date(meeting['date']).getTime() - now.getTime()) / (1000 * 60));

        for (const participant of participants) {
          await publishNotification(redis, {
            recipientId: participant.userId.toString(),
            type: 'meeting_reminder',
            title: 'Meeting Starting Soon',
            message: `"${meeting['title']}" starts in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`,
            payload: { meetingId: meeting['_id'].toString() },
          });
        }
      }
    } catch (err) {
      console.error('[deadline-watcher] Error:', err);
    }
  });

  console.log('[notification-service] Deadline watcher started');
};

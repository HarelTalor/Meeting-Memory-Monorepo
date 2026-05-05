/**
 * SSE Connection Manager
 * Maintains a map of userId → Response objects for Server-Sent Events.
 */

import type { Response } from 'express';

class SseConnectionManager {
  private readonly connections = new Map<string, Set<Response>>();

  addConnection(userId: string, res: Response): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(res);
  }

  removeConnection(userId: string, res: Response): void {
    const userConns = this.connections.get(userId);
    if (userConns) {
      userConns.delete(res);
      if (userConns.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  sendToUser(userId: string, event: { type: string; data: unknown }): void {
    const userConns = this.connections.get(userId);
    if (!userConns || userConns.size === 0) return;

    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
    userConns.forEach((res) => {
      try {
        res.write(payload);
      } catch {
        // Connection likely closed, will be cleaned up on close event
      }
    });
  }

  broadcast(userIds: string[], event: { type: string; data: unknown }): void {
    userIds.forEach((id) => this.sendToUser(id, event));
  }

  getConnectedUserIds(): string[] {
    return Array.from(this.connections.keys());
  }
}

// Singleton
export const sseManager = new SseConnectionManager();

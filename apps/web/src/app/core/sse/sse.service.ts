import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';
import type { Notification } from '@mm/shared-types';

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private eventSource: EventSource | null = null;

  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly connected = signal<boolean>(false);

  connect(): void {
    if (this.eventSource) return;
    const token = this.auth.getToken();
    if (!token) return;

    // Pass token as query param (SSE doesn't support custom headers in browser)
    const url = `${environment.apiUrl}/notifications/stream?token=${token}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => this.connected.set(true);
    this.eventSource.onerror = () => {
      this.connected.set(false);
      // Auto-reconnect after 5 seconds
      setTimeout(() => { this.disconnect(); this.connect(); }, 5000);
    };

    // Listen to all known notification types
    const types = ['meeting_reminder', 'task_deadline', 'participant_added', 'meeting_updated', 'task_assigned'];
    types.forEach((type) => {
      this.eventSource!.addEventListener(type, (event: MessageEvent) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          this.notifications.update((prev) => [notification, ...prev].slice(0, 50));
          this.unreadCount.update((count) => count + 1);
        } catch { /* ignore parse errors */ }
      });
    });
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this.connected.set(false);
  }

  markRead(notificationId: string): void {
    this.notifications.update((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    );
    this.unreadCount.update((count) => Math.max(0, count - 1));
  }

  clearUnread(): void { this.unreadCount.set(0); }

  ngOnDestroy(): void { this.disconnect(); }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { Notification, PaginatedResponse } from '@mm/shared-types';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/notifications`;

  list(page = 1, limit = 20, unreadOnly = false) {
    return this.http.get<PaginatedResponse<Notification>>(this.base, {
      params: { page, limit, unreadOnly },
    });
  }

  markAsRead(id: string) {
    return this.http.patch<Notification>(`${this.base}/${id}/read`, {});
  }

  markAllAsRead() {
    return this.http.patch<void>(`${this.base}/read-all`, {});
  }
}

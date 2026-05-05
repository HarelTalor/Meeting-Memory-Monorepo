import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import type { Meeting } from '@mm/shared-types';

@Component({
  selector: 'app-history-view',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule],
  template: `
    <div class="history-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Meeting History</h1>
          <p class="page-sub">Past meetings and organizational decisions</p>
        </div>
      </div>

      @if (loading()) { <mat-progress-bar mode="indeterminate" color="primary" /> }

      @if (!loading() && meetings().length === 0) {
        <div class="empty-state card">
          <mat-icon>history</mat-icon>
          <h3>No completed meetings yet</h3>
          <p>Completed meetings will appear here for future reference.</p>
        </div>
      }

      <div class="timeline">
        @for (group of groupedMeetings(); track group.month) {
          <div class="timeline-group">
            <div class="timeline-month">{{ group.month }}</div>
            <div class="timeline-items">
              @for (meeting of group.meetings; track meeting._id) {
                <div class="timeline-item card">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <div>
                        <a [routerLink]="['/app/meetings', meeting._id]" class="timeline-title">
                          {{ meeting.title }}
                        </a>
                        <div class="timeline-date">{{ meeting.date | date:'MMMM d, y · h:mm a' }}</div>
                      </div>
                      <span class="badge badge--{{ meeting.status }}">{{ meeting.status }}</span>
                    </div>
                    @if (meeting.subject) {
                      <p class="timeline-subject">{{ meeting.subject }}</p>
                    }
                    <div class="timeline-stats">
                      <div class="stat">
                        <mat-icon>schedule</mat-icon>
                        {{ meeting.date | date:'h:mm a' }} - {{ (meeting.endDate || meeting.date) | date:'h:mm a' }}
                      </div>
                      @if (meeting.location) {
                        <div class="stat">
                          <mat-icon>place</mat-icon>
                          {{ meeting.location }}
                        </div>
                      }
                      <div class="stat">
                        <mat-icon>people</mat-icon>
                        {{ meeting.participants.length + (meeting.guestParticipants?.length || 0) }} participant(s)
                      </div>
                      <div class="stat">
                        <mat-icon>gavel</mat-icon>
                        {{ meeting.decisions.length }} decision(s)
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .history-page { display: flex; flex-direction: column; gap: 24px; }
    .page-sub { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 64px 24px; text-align: center;
      mat-icon { font-size: 64px; color: var(--text-muted); opacity: 0.4; }
      h3 { margin: 0; color: var(--text-primary); }
      p  { margin: 0; color: var(--text-secondary); }
    }

    .timeline { display: flex; flex-direction: column; gap: 32px; }

    .timeline-month {
      font-size: 0.75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 1.5px;
      color: var(--text-muted);
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .timeline-items { display: flex; flex-direction: column; gap: 12px; position: relative; }

    .timeline-item {
      display: flex; gap: 16px;
      padding: 20px;
      position: relative;
    }

    .timeline-dot {
      width: 12px; height: 12px;
      border-radius: 50%;
      background: var(--color-primary);
      flex-shrink: 0;
      margin-top: 6px;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
    }

    .timeline-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }

    .timeline-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }

    .timeline-title {
      font-size: 1rem; font-weight: 700; color: var(--text-primary);
      text-decoration: none;
      &:hover { color: var(--color-primary); text-decoration: underline; }
    }

    .timeline-date { font-size: 0.8rem; color: var(--text-muted); margin-top: 2px; }

    .timeline-subject { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin: 0; }

    .timeline-stats { display: flex; gap: 16px; }

    .stat {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.8rem; color: var(--text-secondary);
      mat-icon { font-size: 16px; color: var(--color-primary); }
    }
  `],
})
export class HistoryViewComponent implements OnInit {
  private readonly meetingApi = inject(MeetingApiService);

  readonly loading = signal(true);
  readonly meetings = signal<Meeting[]>([]);

  readonly groupedMeetings = () => {
    const groups: { month: string; meetings: Meeting[] }[] = [];
    const map = new Map<string, Meeting[]>();
    for (const m of this.meetings()) {
      const key = new Date(m.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    map.forEach((meetings, month) => groups.push({ month, meetings }));
    return groups;
  };

  ngOnInit(): void {
    this.meetingApi.list({ status: 'completed', limit: 100, sortBy: 'date', sortOrder: 'desc' }).subscribe({
      next: (res) => { this.meetings.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import { TaskApiService } from '../../../core/api/task-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Meeting, Task } from '@mm/shared-types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule, MatProgressBarModule],
  template: `
    <div class="dashboard-page">
      <header class="dash-header">
        <div class="dash-welcome">
          <h1>Welcome back, {{ userName() }}! 👋</h1>
          <p class="text-secondary">Here's what's happening with your workspace today.</p>
        </div>
        <div class="dash-actions">
          <button mat-flat-button color="primary" routerLink="/app/meetings/new">
            <mat-icon>add</mat-icon> New Meeting
          </button>
        </div>
      </header>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Stats Overview -->
      <div class="stats-grid">
        <div class="stat-card card">
          <div class="stat-icon stat-icon--meetings">
            <mat-icon>event</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">Total Meetings</span>
            <span class="stat-value">{{ meetings().length }}</span>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon stat-icon--tasks">
            <mat-icon>assignment_turned_in</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">Pending Tasks</span>
            <span class="stat-value">{{ pendingTasksCount() }}</span>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon stat-icon--done">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-info">
            <span class="stat-label">Completed</span>
            <span class="stat-value">{{ completedTasksCount() }}</span>
          </div>
        </div>
      </div>

      <div class="dash-content">
        <!-- Upcoming Meetings -->
        <section class="dash-section">
          <div class="section-header">
            <h2>Upcoming Meetings</h2>
            <a routerLink="/app/calendar" class="view-all">View Calendar</a>
          </div>
          <div class="meetings-list">
            @for (m of upcomingMeetings(); track m._id) {
              <a [routerLink]="['/app/meetings', m._id]" class="meeting-item card clickable">
                <div class="meeting-date">
                  <span class="day">{{ m.date | date:'dd' }}</span>
                  <span class="month">{{ m.date | date:'MMM' }}</span>
                </div>
                <div class="meeting-info">
                  <h3 class="meeting-title">{{ m.title }}</h3>
                  <p class="meeting-meta">
                    <mat-icon>schedule</mat-icon> {{ m.date | date:'h:mm a' }}
                    @if (m.location) {
                      · <mat-icon>place</mat-icon> {{ m.location }}
                    }
                  </p>
                </div>
                <mat-icon class="arrow">chevron_right</mat-icon>
              </a>
            } @empty {
              <div class="empty-state card">
                <mat-icon>event_busy</mat-icon>
                <p>No upcoming meetings scheduled.</p>
              </div>
            }
          </div>
        </section>

        <!-- Recent Tasks -->
        <section class="dash-section">
          <div class="section-header">
            <h2>Active Tasks</h2>
            <a routerLink="/app/tasks" class="view-all">Go to Board</a>
          </div>
          <div class="tasks-list">
            @for (t of activeTasks(); track t._id) {
              <div class="task-item card">
                <div class="task-status-dot" [style.background]="t.status === 'in-progress' ? '#f59e0b' : '#64748b'"></div>
                <div class="task-info">
                  <span class="task-title">{{ t.title }}</span>
                  <span class="task-meta">Due {{ t.deadline | date:'MMM d' }}</span>
                </div>
                <span class="task-badge">{{ t.status | uppercase }}</span>
              </div>
            } @empty {
              <div class="empty-state card">
                <mat-icon>assignment_turned_in</mat-icon>
                <p>You're all caught up!</p>
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { display: flex; flex-direction: column; gap: 32px; }
    .dash-header { display: flex; justify-content: space-between; align-items: center; }
    .dash-welcome h1 { font-size: 1.875rem; font-weight: 800; margin: 0 0 4px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
    .stat-card {
      display: flex; align-items: center; gap: 20px; padding: 24px;
      transition: var(--transition-normal);
      &:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
    }
    .stat-icon {
      width: 56px; height: 56px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 28px; width: 28px; height: 28px; }
      &--meetings { background: rgba(79,70,229,0.1); color: var(--color-primary); }
      &--tasks { background: rgba(245,158,11,0.1); color: #f59e0b; }
      &--done { background: rgba(16,185,129,0.1); color: #10b981; }
    }
    .stat-label { display: block; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 4px; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }

    .dash-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 32px; }
    .dash-section { display: flex; flex-direction: column; gap: 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; }
    .section-header h2 { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .view-all { font-size: 0.875rem; font-weight: 600; color: var(--color-primary); text-decoration: none; }

    .meetings-list, .tasks-list { display: flex; flex-direction: column; gap: 12px; }
    
    .meeting-item {
      display: flex; align-items: center; gap: 16px; padding: 16px; text-decoration: none;
      .meeting-date {
        width: 50px; height: 50px; border-radius: 12px; background: var(--bg-app);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        border: 1px solid var(--border-color);
        .day { font-size: 1.125rem; font-weight: 800; line-height: 1; }
        .month { font-size: 0.65rem; text-transform: uppercase; font-weight: 700; color: var(--text-secondary); }
      }
      .meeting-info { flex: 1; }
      .meeting-title { font-size: 1rem; font-weight: 600; margin: 0 0 4px; color: var(--text-primary); }
      .meeting-meta {
        font-size: 0.8125rem; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; margin: 0;
        mat-icon { font-size: 14px; width: 14px; height: 14px; }
      }
      .arrow { color: var(--text-muted); opacity: 0.5; }
      &:hover .arrow { opacity: 1; transform: translateX(4px); transition: 0.2s; }
    }

    .task-item {
      display: flex; align-items: center; gap: 16px; padding: 16px;
      .task-status-dot { width: 8px; height: 8px; border-radius: 50%; }
      .task-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .task-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
      .task-meta { font-size: 0.75rem; color: var(--text-secondary); }
      .task-badge { font-size: 0.65rem; font-weight: 700; padding: 4px 8px; border-radius: 6px; background: var(--bg-app); color: var(--text-secondary); border: 1px solid var(--border-color); }
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 40px; text-align: center; color: var(--text-secondary);
      mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: 0.3; }
      p { margin: 0; font-size: 0.9375rem; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private readonly meetingApi = inject(MeetingApiService);
  private readonly taskApi = inject(TaskApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly meetings = signal<Meeting[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly userName = computed(() => this.auth.currentUser()?.displayName || 'User');

  readonly pendingTasksCount = computed(() => this.tasks().filter(t => t.status !== 'done').length);
  readonly completedTasksCount = computed(() => this.tasks().filter(t => t.status === 'done').length);

  readonly upcomingMeetings = computed(() => {
    return this.meetings()
      .filter(m => new Date(m.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  });

  readonly activeTasks = computed(() => {
    return this.tasks()
      .filter(t => t.status !== 'done')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  });

  ngOnInit(): void {
    import('rxjs').then(r => {
      r.forkJoin({
        meetings: this.meetingApi.list({ limit: 100 }),
        tasks: this.taskApi.list({ limit: 100 })
      }).subscribe({
        next: (res) => {
          this.meetings.set(res.meetings.data);
          this.tasks.set(res.tasks.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }
}

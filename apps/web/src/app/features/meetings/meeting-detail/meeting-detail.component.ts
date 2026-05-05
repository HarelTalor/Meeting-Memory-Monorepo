import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import { TaskApiService } from '../../../core/api/task-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Meeting, Task, MeetingParticipant } from '@mm/shared-types';

@Component({
  selector: 'app-meeting-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatTabsModule,
    MatChipsModule, MatDividerModule, MatProgressBarModule, MatDialogModule
  ],
  template: `
    <div class="detail-page">
      <!-- Header -->
      <div class="page-header">
        <button mat-icon-button routerLink="/app/calendar" id="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1 class="page-title">{{ meeting()?.title }}</h1>
          @if (meeting()) {
            <span class="badge badge--{{ meeting()!.status }}">{{ meeting()!.status }}</span>
          }
        </div>
        @if (meeting()) {
          <div class="header-actions">
            <a [routerLink]="['/app/meetings', meeting()!._id, 'edit']">
              <button mat-stroked-button color="primary" id="edit-meeting-btn">
                <mat-icon>edit</mat-icon> Edit
              </button>
            </a>
            <button mat-stroked-button color="warn" (click)="onDelete()" id="delete-meeting-btn">
              <mat-icon>delete_outline</mat-icon>
            </button>
          </div>
        }
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      @if (meeting()) {
        <!-- Meta info bar -->
        <div class="meta-bar card">
          <div class="meta-item">
            <mat-icon>schedule</mat-icon>
            <div>
              <div class="meta-label">Date & Time</div>
              <div class="meta-value">{{ meeting()!.date | date:'EEEE, MMMM d, y · h:mm a' }}</div>
            </div>
          </div>
          @if (meeting()!.location) {
            <div class="meta-item">
              <mat-icon>place</mat-icon>
              <div>
                <div class="meta-label">Location</div>
                <div class="meta-value">{{ meeting()!.location }}</div>
              </div>
            </div>
          }
          <div class="meta-item">
            <mat-icon>people</mat-icon>
            <div>
              <div class="meta-label">Participants</div>
              <div class="meta-value">{{ meeting()!.participants.length + (meeting()!.guestParticipants?.length || 0) }} member(s)</div>
            </div>
          </div>
          <div class="meta-item">
            <mat-icon>task_alt</mat-icon>
            <div>
              <div class="meta-label">Tasks</div>
              <div class="meta-value">{{ tasks().length }} task(s) · {{ doneTasks() }} done</div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <mat-tab-group animationDuration="200ms" class="detail-tabs">

          <!-- Summary tab -->
          <mat-tab label="Summary">
            <div class="tab-content">
              @if (meeting()!.summary) {
                <div class="summary-card">
                  <h3 class="section-title">Summary & Highlights</h3>
                  <div class="summary-text">{{ meeting()!.summary }}</div>
                </div>
              }
              
              @if (meeting()!.decisions.length > 0) {
                <div class="summary-card">
                  <h3 class="section-title">Decisions Made</h3>
                  <div class="decisions-list">
                    @for (d of meeting()!.decisions; track d._id) {
                      <div class="decision-item">
                        <mat-icon>gavel</mat-icon>
                        <div class="decision-text">{{ d.text }}</div>
                      </div>
                    }
                  </div>
                </div>
              }

              @if (!meeting()!.summary && meeting()!.decisions.length === 0) {
                <div class="empty-state">
                  <mat-icon>notes</mat-icon>
                  <p>No summary or decisions added yet.</p>
                  <a [routerLink]="['/app/meetings', meeting()!._id, 'edit']">
                    <button mat-stroked-button color="primary">Add Details</button>
                  </a>
                </div>
              }
            </div>
          </mat-tab>

          <!-- Decisions tab -->
          <mat-tab [label]="'Decisions (' + meeting()!.decisions.length + ')'">
            <div class="tab-content">
              @if (meeting()!.decisions.length === 0) {
                <div class="empty-state">
                  <mat-icon>gavel</mat-icon>
                  <p>No decisions recorded.</p>
                </div>
              }
              @for (d of meeting()!.decisions; track d._id) {
                <div class="decision-item">
                  <mat-icon class="decision-icon">gavel</mat-icon>
                  <div class="decision-text">{{ d.text }}</div>
                  <div class="decision-meta">{{ d.createdAt | date:'shortDate' }}</div>
                </div>
              }
            </div>
          </mat-tab>

          <mat-tab [label]="'Tasks (' + tasks().length + ')'">
            <div class="tab-content">
              <div class="tab-header">
                <button mat-flat-button color="primary" (click)="addTask()" id="add-task-btn">
                  <mat-icon>add</mat-icon> New Task
                </button>
              </div>

              @if (tasks().length === 0) {
                <div class="empty-state">
                  <mat-icon>assignment</mat-icon>
                  <p>No tasks yet.</p>
                </div>
              }
              @for (task of tasks(); track task._id) {
                <div class="task-item">
                  <span class="badge badge--{{ task.status }}" style="min-width: 90px; text-align: center;">{{ task.status }}</span>
                  <div class="task-info">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-meta">Due {{ task.deadline | date:'mediumDate' }}</div>
                  </div>
                  @if (task.status !== 'done') {
                    <button mat-icon-button color="primary" (click)="markTaskDone(task)" [id]="'done-task-' + task._id">
                      <mat-icon>check_circle_outline</mat-icon>
                    </button>
                  }
                </div>
              }
            </div>
          </mat-tab>

          <!-- Participants tab -->
          <mat-tab [label]="'Participants (' + ((meeting()?.participants?.length || 0) + (meeting()?.guestParticipants?.length || 0)) + ')'">
            <div class="tab-content">
              <!-- Internal Participants -->
              @for (p of meeting()!.participants; track p.userId) {
                <div class="participant-item">
                  <div class="participant-avatar">
                    {{ getInitials(p) }}
                  </div>
                  <div class="participant-info">
                    <div class="participant-name">{{ getDisplayName(p) }}</div>
                    <div class="participant-role">Member ({{ p.permission }})</div>
                  </div>
                  <span class="badge badge--{{ p.permission }}">{{ p.permission }}</span>
                </div>
              }
              <!-- Guest Participants -->
              @for (name of meeting()?.guestParticipants || []; track name) {
                <div class="participant-item">
                  <div class="participant-avatar participant-avatar--guest">
                    {{ name.slice(0, 2).toUpperCase() }}
                  </div>
                  <div class="participant-info">
                    <div class="participant-name">{{ name }}</div>
                    <div class="participant-role">Guest</div>
                  </div>
                  <span class="badge badge--viewer">Guest</span>
                </div>
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .detail-page { display: flex; flex-direction: column; gap: 20px; }

    .page-header { display: flex; align-items: center; gap: 12px; }
    .header-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .header-actions { display: flex; gap: 8px; }

    .meta-bar {
      display: flex; gap: 0; flex-wrap: wrap;
      border-radius: var(--border-radius); overflow: hidden;
      padding: 0;
    }

    .meta-item {
      display: flex; align-items: center; gap: 12px;
      padding: 16px 24px;
      flex: 1; min-width: 180px;
      border-right: 1px solid var(--border-color);
      &:last-child { border-right: none; }
      mat-icon { color: var(--color-primary); font-size: 22px; flex-shrink: 0; }
    }

    .meta-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; }
    .meta-value { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); margin-top: 2px; }

    .detail-tabs {
      background: var(--bg-card);
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .tab-content { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
    .tab-header { display: flex; justify-content: flex-end; margin-bottom: 8px; }

    .summary-card {
      background: var(--bg-app); border: 1px solid var(--border-color);
      border-radius: 12px; padding: 20px; margin-bottom: 16px;
    }
    .section-title { font-size: 1rem; font-weight: 700; color: var(--color-primary); margin: 0 0 12px; }
    .summary-text { font-size: 0.95rem; line-height: 1.7; color: var(--text-primary); white-space: pre-wrap; }
    .decisions-list { display: flex; flex-direction: column; gap: 8px; }

    .participant-avatar--guest { background: linear-gradient(135deg, #64748b, #94a3b8) !important; }

    .decision-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 10px 14px; border-radius: 10px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      mat-icon { font-size: 18px; color: var(--color-primary); flex-shrink: 0; margin-top: 2px; }
      .decision-text { font-size: 0.875rem; line-height: 1.5; }
    }

    .task-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 10px;
      background: var(--bg-app); border: 1px solid var(--border-color);
    }
    .task-info { flex: 1; }
    .task-title { font-size: 0.875rem; font-weight: 600; }
    .task-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

    .participant-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; border-radius: 10px;
      border: 1px solid var(--border-color);
    }
    .participant-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; color: white; font-size: 14px; flex-shrink: 0;
    }
    .participant-info { flex: 1; }
    .participant-name { font-size: 0.875rem; font-weight: 600; }
    .participant-role { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }
  `],
})
export class MeetingDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly meetingApi = inject(MeetingApiService);
  private readonly taskApi = inject(TaskApiService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthService);

  readonly meeting = signal<Meeting | null>(null);
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);

  readonly doneTasks = () => this.tasks().filter((t) => t.status === 'done').length;

  getDisplayName(p: MeetingParticipant): string {
    const currentUser = this.auth.currentUser();
    if (p.userId === currentUser?._id) return currentUser?.displayName || 'Organizer';
    return p.displayName || 'Unknown Member';
  }

  getInitials(p: any): string {
    const name = p.displayName || 'Participant';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    this.meetingApi.get(this.id).subscribe({
      next: (m) => { this.meeting.set(m); this.loading.set(false); },
      error: () => this.router.navigate(['/app/calendar']),
    });
    this.taskApi.list({ meetingId: this.id }).subscribe({
      next: (res) => this.tasks.set(res.data),
    });
  }

  markTaskDone(task: Task): void {
    this.taskApi.update(task._id, { status: 'done' }).subscribe({
      next: (updated) => {
        this.tasks.update((prev) => prev.map((t) => (t._id === task._id ? updated : t)));
        this.snackBar.open('Task marked as done!', '✓', { duration: 2000, panelClass: 'mm-snack-success' });
      },
    });
  }

  onDelete(): void {
    if (!confirm('Are you sure you want to delete this meeting? This will also delete all connected tasks.')) return;
    
    this.loading.set(true);

    // First delete all connected tasks
    const tasksToDelete = this.tasks();
    if (tasksToDelete.length > 0) {
      import('rxjs').then(r => {
        const deleteObservables = tasksToDelete.map(t => this.taskApi.delete(t._id));
        r.forkJoin(deleteObservables).subscribe({
          next: () => this.deleteMeetingOnly(),
          error: () => this.deleteMeetingOnly() // Proceed to delete meeting even if a task fails
        });
      });
    } else {
      this.deleteMeetingOnly();
    }
  }

  private deleteMeetingOnly(): void {
    this.meetingApi.delete(this.id).subscribe({
      next: () => {
        this.snackBar.open('Meeting and tasks deleted', '', { duration: 2000 });
        this.router.navigate(['/app/calendar']);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err?.error?.detail ?? 'Delete failed', 'Dismiss', { duration: 3000 });
      },
    });
  }

  addTask(): void {
    import('../../tasks/task-form/task-form.component').then(m => {
      const dialogRef = this.dialog.open(m.TaskFormComponent, {
        width: '500px',
        data: { meetingId: this.id }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.tasks.update(prev => [...prev, result]);
          this.snackBar.open('Task created successfully!', '✓', { duration: 3000 });
        }
      });
    });
  }
}

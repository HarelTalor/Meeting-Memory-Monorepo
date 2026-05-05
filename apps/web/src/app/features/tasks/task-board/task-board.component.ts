import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import { TaskApiService } from '../../../core/api/task-api.service';
import type { Task, TaskStatus, Meeting } from '@mm/shared-types';

interface Column { id: TaskStatus; label: string; icon: string; color: string; tasks: Task[]; }

@Component({
  selector: 'app-task-board',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    DragDropModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressBarModule, MatDialogModule,
  ],
  template: `
    <div class="task-board-page">
      <div class="page-header">
        <div class="page-header-main">
          <h1 class="page-title">My Tasks</h1>
          <p class="page-sub">{{ totalTasks() }} task(s) · {{ doneTasks() }} completed</p>
        </div>
        <button mat-flat-button color="primary" (click)="onAddTask()" id="add-task-btn">
          <mat-icon>add</mat-icon> New Task
        </button>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" color="primary" />
      }

      <div class="kanban-board">
        @for (col of columns(); track col.id) {
          <div class="kanban-column">
            <div class="kanban-column__header">
              <div class="column-title">
                <mat-icon [style.color]="col.color">{{ col.icon }}</mat-icon>
                <span>{{ col.label }}</span>
                <span class="column-count">{{ col.tasks.length }}</span>
              </div>
            </div>

            <div
              class="kanban-column__body"
              cdkDropList
              [id]="col.id"
              [cdkDropListData]="col.tasks"
              [cdkDropListConnectedTo]="connectedLists"
              (cdkDropListDropped)="onDrop($event, col.id)"
            >
              @for (task of col.tasks; track task._id) {
                <div class="task-card" cdkDrag [cdkDragData]="task">
                  <div class="task-card__drag-handle" cdkDragHandle>
                    <mat-icon>drag_indicator</mat-icon>
                  </div>
                  <div class="task-card__body">
                    <div class="task-card__title">{{ task.title }}</div>
                    @if (task.description) {
                      <div class="task-card__desc">{{ task.description }}</div>
                    }
                    <div class="task-card__meta">
                      <div class="task-deadline" [class.task-deadline--overdue]="isOverdue(task)">
                        <mat-icon>schedule</mat-icon>
                        {{ task.deadline | date:'MMM d' }}
                      </div>
                      <div class="task-meeting-link">
                        <mat-icon>event</mat-icon>
                        <span class="meeting-title-tag">{{ getMeetingTitle(task.meetingId) }}</span>
                        <a [routerLink]="['/app/meetings', task.meetingId]" class="meeting-view-link">
                          <mat-icon>open_in_new</mat-icon>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div *cdkDragPlaceholder class="drag-placeholder"></div>
                </div>
              }

              @if (col.tasks.length === 0) {
                <div class="column-empty">
                  <mat-icon>{{ col.icon }}</mat-icon>
                  <span>No tasks here</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .task-board-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-sub { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }

    .kanban-board {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      align-items: start;
      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .kanban-column {
      background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      min-height: 200px;
    }

    .kanban-column__header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      background: var(--bg-card);
    }

    .column-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 0.875rem; font-weight: 600; color: var(--text-primary);
      mat-icon { font-size: 18px; }
    }

    .column-count {
      margin-left: auto;
      background: var(--border-color);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }

    .kanban-column__body {
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 100px;
    }

    .task-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      display: flex;
      gap: 8px;
      padding: 12px;
      cursor: grab;
      transition: var(--transition-fast);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
      &:active { cursor: grabbing; }
    }

    .task-card__drag-handle {
      display: flex; align-items: center;
      mat-icon { font-size: 18px; color: var(--text-muted); }
    }

    .task-card__body { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .task-card__title { font-size: 0.875rem; font-weight: 600; line-height: 1.4; }
    .task-card__desc { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; }

    .task-card__meta {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 4px;
    }

    .task-deadline {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: var(--text-muted);
      mat-icon { font-size: 14px; }
      &--overdue { color: var(--color-danger) !important; }
    }

    .task-meeting-link {
      display: flex; align-items: center; gap: 4px;
      color: var(--text-muted); font-size: 0.7rem;
      mat-icon { font-size: 14px; }
      .meeting-title-tag { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    }
    .meeting-view-link { color: var(--color-primary); display: flex; mat-icon { font-size: 14px; } }

    .drag-placeholder {
      background: rgba(79,70,229,0.06);
      border: 2px dashed var(--color-primary);
      border-radius: 10px;
      min-height: 60px;
    }

    .column-empty {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 32px 0; color: var(--text-muted); font-size: 0.8rem;
      mat-icon { font-size: 32px; opacity: 0.3; }
    }
  `],
})
export class TaskBoardComponent implements OnInit {
  private readonly taskApi = inject(TaskApiService);
  private readonly meetingApi = inject(MeetingApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  private readonly allTasks = signal<Task[]>([]);
  private readonly allMeetings = signal<Meeting[]>([]);

  readonly connectedLists: TaskStatus[] = ['todo', 'in-progress', 'done'];

  readonly totalTasks = computed(() => this.allTasks().length);
  readonly doneTasks = computed(() => this.allTasks().filter((t) => t.status === 'done').length);

  readonly columns = computed<Column[]>(() => {
    const tasks = this.allTasks();
    return [
      { id: 'todo',        label: 'To Do',       icon: 'radio_button_unchecked', color: '#64748b', tasks: tasks.filter((t) => t.status === 'todo') },
      { id: 'in-progress', label: 'In Progress',  icon: 'pending',                color: '#f59e0b', tasks: tasks.filter((t) => t.status === 'in-progress') },
      { id: 'done',        label: 'Done',         icon: 'check_circle',           color: '#10b981', tasks: tasks.filter((t) => t.status === 'done') },
    ];
  });

  ngOnInit(): void {
    import('rxjs').then(r => {
      r.forkJoin({
        tasks: this.taskApi.list({ limit: 200 }),
        meetings: this.meetingApi.list({ limit: 200 })
      }).subscribe({
        next: (res) => {
          this.allTasks.set(res.tasks.data);
          this.allMeetings.set(res.meetings.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  getMeetingTitle(id: string): string {
    return this.allMeetings().find(m => m._id === id)?.title || 'Meeting';
  }

  isOverdue(task: Task): boolean {
    return task.status !== 'done' && new Date(task.deadline) < new Date();
  }

  onDrop(event: CdkDragDrop<Task[]>, newStatus: TaskStatus): void {
    const task: Task = event.item.data;
    if (event.previousContainer === event.container) return;

    // Optimistically update local state
    this.allTasks.update((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, status: newStatus } : t))
    );

    // Persist to server
    this.taskApi.update(task._id, { status: newStatus }).subscribe({
      error: () => {
        // Revert on failure
        this.allTasks.update((prev) =>
          prev.map((t) => (t._id === task._id ? { ...t, status: task.status } : t))
        );
        this.snackBar.open('Failed to update task status', 'Dismiss', { duration: 3000, panelClass: 'mm-snack-error' });
      },
    });
  }

  onAddTask(): void {
    import('../task-form/task-form.component').then(m => {
      const dialogRef = this.dialog.open(m.TaskFormComponent, {
        width: '500px',
        data: {}
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.taskApi.list({ limit: 100 }).subscribe(res => this.allTasks.set(res.data));
          this.snackBar.open('Task created successfully!', '✓', { duration: 3000 });
        }
      });
    });
  }
}

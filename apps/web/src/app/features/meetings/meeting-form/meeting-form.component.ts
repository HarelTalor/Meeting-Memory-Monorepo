import { Component, inject, signal, OnInit, Input } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatStepperModule } from '@angular/material/stepper';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import { TaskApiService } from '../../../core/api/task-api.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Meeting, Task } from '@mm/shared-types';

@Component({
  selector: 'app-meeting-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatStepperModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="meeting-form-page">
      <div class="page-header">
        <button mat-icon-button (click)="goBack()" id="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1 class="page-title">{{ isEdit() ? 'Edit Meeting' : 'New Meeting' }}</h1>
          <p class="page-sub">{{ isEdit() ? 'Update meeting details' : 'Schedule a new meeting' }}</p>
        </div>
      </div>

      <div class="form-card card">
        <mat-stepper [linear]="true" #stepper labelPosition="bottom">

          <!-- Step 1: Details -->
          <mat-step [stepControl]="detailsGroup" label="Details">
            <form [formGroup]="detailsGroup" class="step-form">
              <mat-form-field appearance="outline">
                <mat-label>Meeting Title</mat-label>
                <input matInput formControlName="title" id="meeting-title" placeholder="e.g. Q1 Planning" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Subject / Agenda</mat-label>
                <textarea matInput formControlName="subject" id="meeting-subject" rows="3"
                  placeholder="What will be discussed?"></textarea>
              </mat-form-field>

              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Date</mat-label>
                  <input matInput [matDatepicker]="datepicker" formControlName="date" id="meeting-date" />
                  <mat-datepicker-toggle matIconSuffix [for]="datepicker" />
                  <mat-datepicker #datepicker />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Start Time</mat-label>
                  <mat-select formControlName="startTime" id="start-time">
                    @for (t of timeSlots; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>End Time</mat-label>
                  <mat-select formControlName="endTime" id="end-time">
                    @for (t of endTimeSlots; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                  @if (detailsGroup.hasError('invalidTime')) {
                    <mat-error>End time must be after start time</mat-error>
                  }
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Location (optional)</mat-label>
                <input matInput formControlName="location" id="meeting-location" placeholder="Room or URL" />
              </mat-form-field>

              <div class="participants-section">
                <label class="section-label">Participants (Names)</label>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Add Participants</mat-label>
                  <mat-chip-grid #chipGrid aria-label="Participant selection">
                    @for (name of participantNames(); track name) {
                      <mat-chip-row (removed)="removeParticipantName(name)">
                        {{ name }}
                        <button matChipRemove><mat-icon>cancel</mat-icon></button>
                      </mat-chip-row>
                    }
                    <input placeholder="New participant..."
                      [matChipInputFor]="chipGrid"
                      (matChipInputTokenEnd)="addParticipantName($event.value); $event.chipInput!.clear()" />
                  </mat-chip-grid>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status" id="meeting-status">
                  <mat-option value="scheduled">Scheduled</mat-option>
                  <mat-option value="completed">Completed</mat-option>
                  <mat-option value="cancelled">Cancelled</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="step-actions">
                <button mat-flat-button color="primary" matStepperNext [disabled]="detailsGroup.invalid">
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Summary & Decisions -->
          <mat-step label="Summary">
            <form [formGroup]="summaryGroup" class="step-form">
              <mat-form-field appearance="outline">
                <mat-label>Meeting Summary</mat-label>
                <textarea matInput formControlName="summary" id="meeting-summary" rows="5"
                  placeholder="Key points discussed..."></textarea>
              </mat-form-field>

              <div class="decisions-section">
                <div class="decisions-header">
                  <label class="section-label">Decisions Made</label>
                  <button mat-stroked-button type="button" (click)="addDecision()" id="add-decision-btn">
                    <mat-icon>add</mat-icon> Add Decision
                  </button>
                </div>
                <div formArrayName="decisions" class="decisions-list">
                  @for (ctrl of decisionsArray.controls; track $index) {
                    <div class="decision-row">
                      <mat-form-field appearance="outline" class="decision-input">
                        <mat-label>Decision {{ $index + 1 }}</mat-label>
                        <input matInput [formControlName]="$index" [id]="'decision-' + $index" />
                      </mat-form-field>
                      <button mat-icon-button color="warn" type="button" (click)="removeDecision($index)" 
                        matTooltip="Remove decision" class="delete-row-btn">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious>Back</button>
                <button mat-flat-button color="primary" matStepperNext>
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Tasks -->
          <mat-step label="Tasks">
            <form [formGroup]="tasksGroup" class="step-form">
              <div class="tasks-section">
                <div class="tasks-header">
                  <label class="section-label">Action Items (Tasks)</label>
                  <button mat-stroked-button type="button" (click)="addTask()" id="add-task-btn-step">
                    <mat-icon>add</mat-icon> Add Task
                  </button>
                </div>

                <div formArrayName="tasks" class="tasks-list">
                  @for (group of tasksArray.controls; track $index) {
                    <div [formGroupName]="$index" class="task-row-form">
                      <mat-form-field appearance="outline" class="task-title-input">
                        <mat-label>Task Title</mat-label>
                        <input matInput formControlName="title" placeholder="What needs to be done?" />
                      </mat-form-field>
                      
                      <mat-form-field appearance="outline" class="task-date-input">
                        <mat-label>Deadline</mat-label>
                        <input matInput [matDatepicker]="taskPicker" formControlName="deadline" />
                        <mat-datepicker-toggle matIconSuffix [for]="taskPicker" />
                        <mat-datepicker #taskPicker />
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="task-status-input">
                        <mat-label>Status</mat-label>
                        <mat-select formControlName="status">
                          <mat-option value="todo">To Do</mat-option>
                          <mat-option value="in-progress">In Progress</mat-option>
                          <mat-option value="done">Done</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <button mat-icon-button color="warn" type="button" (click)="removeTask($index)" 
                        matTooltip="Remove task" class="delete-row-btn">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>
                  }
                  @if (tasksArray.length === 0) {
                    <div class="empty-tasks-hint">No tasks added yet. Action items will be shown here.</div>
                  }
                </div>
              </div>

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious>Back</button>
                <button mat-flat-button color="primary" matStepperNext>
                  Next <mat-icon>arrow_forward</mat-icon>
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Review & Submit -->
          <mat-step label="Review">
            <div class="review-section">
              <div class="review-card">
                <div class="review-title">{{ detailsGroup.get('title')?.value }}</div>
                <div class="review-row">
                  <mat-icon>schedule</mat-icon>
                  {{ detailsGroup.get('date')?.value | date:'mediumDate' }} · 
                  {{ detailsGroup.get('startTime')?.value }} - {{ detailsGroup.get('endTime')?.value }}
                </div>
                @if (detailsGroup.get('location')?.value) {
                  <div class="review-row">
                    <mat-icon>place</mat-icon> {{ detailsGroup.get('location')?.value }}
                  </div>
                }
                @if (summaryGroup.get('summary')?.value) {
                  <p class="review-summary">{{ summaryGroup.get('summary')?.value }}</p>
                }
                @if (decisionsArray.length > 0) {
                  <div class="review-decisions">
                    <div class="section-label" style="margin-bottom: 8px;">Decisions</div>
                    @for (d of decisionsArray.controls; track $index) {
                      <div class="decision-chip">
                        <mat-icon>gavel</mat-icon> {{ d.value }}
                      </div>
                    }
                  </div>
                }

                @if (tasksArray.length > 0) {
                  <div class="review-tasks">
                    <div class="section-label" style="margin-bottom: 8px;">New Tasks</div>
                    @for (t of tasksArray.controls; track $index) {
                      <div class="task-chip">
                        <mat-icon>assignment</mat-icon> 
                        <span style="flex:1">{{ t.get('title')?.value }}</span>
                        <span class="task-chip-date">{{ t.get('deadline')?.value | date:'MMM d' }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

              @if (error()) {
                <div class="form-error">{{ error() }}</div>
              }

              <div class="step-actions">
                <button mat-stroked-button matStepperPrevious>Back</button>
                <button mat-flat-button color="primary" (click)="onSubmit()" id="submit-meeting-btn"
                  [disabled]="loading()">
                  @if (loading()) { <mat-spinner diameter="20" color="accent" /> }
                  @else { {{ isEdit() ? 'Save Changes' : 'Create Meeting' }} }
                </button>
              </div>
            </div>
          </mat-step>
        </mat-stepper>
      </div>
    </div>
  `,
  styles: [`
    .meeting-form-page { display: flex; flex-direction: column; gap: 24px; max-width: 780px; }

    .page-header { display: flex; align-items: center; gap: 12px; }
    .page-sub { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }

    .form-card { padding: 8px; }

    .step-form { display: flex; flex-direction: column; gap: 16px; padding: 24px 16px 0; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      @media (max-width: 600px) { grid-template-columns: 1fr; } }

    .step-actions { display: flex; gap: 8px; justify-content: flex-end; padding: 16px 0; }

    .decision-row, .task-row-form { display: flex; align-items: flex-start; gap: 8px; width: 100%; margin-bottom: 8px; }
    .decision-input { flex: 1; }
    .task-title-input { flex: 1; min-width: 150px; }
    .delete-row-btn { margin-top: 4px; flex-shrink: 0; }

    .participants-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; padding: 0 4px; }
    .participants-chips { display: flex; flex-wrap: wrap; gap: 8px; }

    .tasks-section { display: flex; flex-direction: column; gap: 12px; }
    .tasks-header { display: flex; justify-content: space-between; align-items: center; }
    .tasks-list { display: flex; flex-direction: column; gap: 8px; }
    .task-date-input { width: 140px; flex-shrink: 0; }
    .task-status-input { width: 130px; flex-shrink: 0; }
    .empty-tasks-hint { font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 12px; border: 1px dashed var(--border-color); border-radius: 8px; }

    .review-section { padding: 24px 16px; display: flex; flex-direction: column; gap: 20px; }
    .review-card {
      background: var(--bg-app); border: 1px solid var(--border-color);
      border-radius: var(--border-radius); padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .review-title { font-size: 1.25rem; font-weight: 700; color: var(--text-primary); }
    .review-row { display: flex; align-items: center; gap: 8px;
      color: var(--text-secondary); font-size: 0.875rem;
      mat-icon { font-size: 18px; color: var(--color-primary); }
    }
    .review-summary { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; margin: 0; }
    .review-decisions, .review-tasks { display: flex; flex-direction: column; gap: 6px; }
    .decision-chip, .task-chip {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-radius: 8px;
      background: rgba(79,70,229,0.06); color: var(--text-primary);
      font-size: 0.875rem;
      mat-icon { font-size: 16px; color: var(--color-primary); }
    }
    .task-chip-date { font-size: 0.75rem; color: var(--text-muted); }
    .form-error {
      padding: 10px 14px; border-radius: 8px;
      background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
      color: var(--color-danger); font-size: 0.85rem;
    }
  `],
})
export class MeetingFormComponent implements OnInit {
  @Input() id?: string; // set by router when editing

  private readonly meetingApi = inject(MeetingApiService);
  private readonly taskApi = inject(TaskApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEdit = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly participantNames = signal<string[]>([]);

  readonly timeSlots: string[] = [];

  constructor() {
    for (let h = 0; h < 24; h++) {
      const hh = h.toString().padStart(2, '0');
      this.timeSlots.push(`${hh}:00`, `${hh}:30`);
    }
  }

  readonly detailsGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    subject: ['', [Validators.required, Validators.minLength(2)]],
    date: [new Date(), Validators.required],
    startTime: ['10:00', Validators.required],
    endTime: ['11:00', Validators.required],
    location: [''],
    status: ['scheduled'],
  }, { validators: this.timeValidator });

  private timeValidator(group: any) {
    const start = group.get('startTime')?.value;
    const end = group.get('endTime')?.value;
    if (start && end && start >= end) {
      return { invalidTime: true };
    }
    return null;
  }

  get endTimeSlots(): string[] {
    const start = this.detailsGroup.get('startTime')?.value;
    if (!start) return this.timeSlots;
    return this.timeSlots.filter(t => t > start);
  }

  readonly summaryGroup = this.fb.group({
    summary: [''],
    decisions: this.fb.array([]),
  });

  readonly tasksGroup = this.fb.group({
    tasks: this.fb.array([]),
  });

  get decisionsArray(): FormArray { return this.summaryGroup.get('decisions') as FormArray; }
  get tasksArray(): FormArray { return this.tasksGroup.get('tasks') as FormArray; }

  ngOnInit(): void {
    // Pre-fill date from query param (e.g. from calendar date click)
    const dateParam = this.route.snapshot.queryParamMap.get('date');
    if (dateParam) this.detailsGroup.patchValue({ date: new Date(dateParam) });

    if (this.id) {
      this.isEdit.set(true);
      this.loadMeeting(this.id);
    }
  }

  private loadMeeting(id: string): void {
    this.meetingApi.get(id).subscribe({
      next: (m) => {
        const startDate = new Date(m.date);
        const startStr = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
        
        let endStr = '11:00';
        if (m.endDate) {
          const endDate = new Date(m.endDate);
          endStr = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
        }
        
        this.detailsGroup.patchValue({
          title: m.title, subject: m.subject,
          date: startDate, 
          startTime: startStr,
          endTime: endStr,
          location: m.location ?? '',
          status: m.status,
        });
        if (m.summary) this.summaryGroup.patchValue({ summary: m.summary });
        
        // Load participants
        this.participantNames.set(m.guestParticipants || []);

        // Load decisions
        this.decisionsArray.clear();
        m.decisions.forEach(d => {
          this.decisionsArray.push(this.fb.control(d.text, Validators.required));
        });

        // Load existing tasks
        this.taskApi.list({ meetingId: m._id, limit: 50 }).subscribe(res => {
          this.tasksArray.clear();
          res.data.forEach(t => {
            this.tasksArray.push(this.fb.group({
              _id: [t._id], // Track ID if it exists
              title: [t.title, Validators.required],
              deadline: [new Date(t.deadline), Validators.required],
              status: [t.status, Validators.required]
            }));
          });
        });
      },
      error: () => this.router.navigate(['/app/calendar']),
    });
  }

  addDecision(): void {
    this.decisionsArray.push(this.fb.control('', Validators.required));
  }

  addTask(): void {
    this.tasksArray.push(this.fb.group({
      title: ['', Validators.required],
      deadline: [new Date(), Validators.required],
      status: ['todo', Validators.required]
    }));
  }

  removeTask(index: number): void { this.tasksArray.removeAt(index); }

  removeDecision(index: number): void { this.decisionsArray.removeAt(index); }

  addParticipantName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed || this.participantNames().includes(trimmed)) return;
    this.participantNames.update(prev => [...prev, trimmed]);
  }

  removeParticipantName(name: string): void {
    this.participantNames.update(prev => prev.filter(n => n !== name));
  }

  goBack(): void { this.router.navigate(['/app/calendar']); }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set('');

    const details = this.detailsGroup.getRawValue();
    const summary = this.summaryGroup.getRawValue();

    const [sh, sm] = (details.startTime || '10:00').split(':').map(Number);
    const startDate = new Date(details.date as Date);
    startDate.setHours(sh, sm, 0, 0);

    const [eh, em] = (details.endTime || '11:00').split(':').map(Number);
    const endDate = new Date(details.date as Date);
    endDate.setHours(eh, em, 0, 0);

    const payload = {
      title: details.title!,
      subject: details.subject!,
      date: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: details.location || undefined,
      status: details.status as 'scheduled' | 'completed' | 'cancelled',
      summary: summary.summary || undefined,
      decisions: (summary.decisions as string[]).filter(d => !!d),
      guestParticipants: this.participantNames(),
      participantIds: [],
    };

    const obs = this.isEdit()
      ? this.meetingApi.update(this.id!, payload)
      : this.meetingApi.create(payload);

    obs.subscribe({
      next: (meeting: Meeting) => {
        // Now create/update tasks
        const taskFormValue = this.tasksGroup.getRawValue().tasks;
        const taskObservables = taskFormValue.map((t: any) => {
          const taskPayload = {
            meetingId: meeting._id,
            title: t.title,
            deadline: (t.deadline as Date).toISOString(),
            status: t.status,
            assigneeId: this.auth.currentUser()?._id || '',
          };
          return t._id 
            ? this.taskApi.update(t._id, taskPayload) 
            : this.taskApi.create(taskPayload);
        });

        if (taskObservables.length > 0) {
          import('rxjs').then(r => {
            r.forkJoin(taskObservables).subscribe({
              next: () => this.finalizeSubmit(meeting),
              error: () => {
                this.snackBar.open('Meeting saved, but some tasks failed to save.', 'Warning', { duration: 5000 });
                this.finalizeSubmit(meeting);
              }
            });
          });
        } else {
          this.finalizeSubmit(meeting);
        }
      },
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Something went wrong. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private finalizeSubmit(meeting: Meeting): void {
    this.snackBar.open(
      this.isEdit() ? 'Meeting updated!' : 'Meeting created!',
      '✓', { duration: 3000, panelClass: 'mm-snack-success' }
    );
    this.router.navigate(['/app/meetings', meeting._id]);
  }
}

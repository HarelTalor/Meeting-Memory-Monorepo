import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { TaskApiService } from '../../../core/api/task-api.service';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatDatepickerModule, MatNativeDateModule, MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.task ? 'Edit Task' : 'New Task' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="task-form">
        <mat-form-field appearance="outline">
          <mat-label>Task Title</mat-label>
          <input matInput formControlName="title" placeholder="What needs to be done?" />
        </mat-form-field>

        @if (!data.meetingId) {
          <mat-form-field appearance="outline">
            <mat-label>Associate with Meeting</mat-label>
            <mat-select formControlName="meetingId">
              @for (m of meetings(); track m._id) {
                <mat-option [value]="m._id">{{ m.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Deadline</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="deadline" />
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              <mat-option value="todo">To Do</mat-option>
              <mat-option value="in-progress">In Progress</mat-option>
              <mat-option value="done">Done</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid || loading()" (click)="onSubmit()">
        {{ data.task ? 'Save' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .task-form { display: flex; flex-direction: column; gap: 12px; padding-top: 8px; min-width: 400px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  `]
})
export class TaskFormComponent implements OnInit {
  readonly data = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskFormComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly taskApi = inject(TaskApiService);
  private readonly meetingApi = inject(MeetingApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly meetings = signal<any[]>([]);

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    deadline: [new Date(), Validators.required],
    status: ['todo', Validators.required],
    meetingId: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.data.task) {
      this.form.patchValue({
        title: this.data.task.title,
        description: this.data.task.description,
        deadline: new Date(this.data.task.deadline),
        status: this.data.task.status,
        meetingId: this.data.task.meetingId,
      });
    } else if (this.data.meetingId) {
      this.form.patchValue({ meetingId: this.data.meetingId });
    }

    if (!this.data.meetingId && !this.data.task) {
      this.meetingApi.list({ limit: 100 }).subscribe(res => this.meetings.set(res.data));
    }
  }

  onCancel(): void { this.dialogRef.close(); }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);

    const val = this.form.getRawValue();
    const payload: any = {
      title: val.title || '',
      description: val.description || '',
      status: val.status || 'todo',
      meetingId: val.meetingId || '',
      assigneeId: this.auth.currentUser()?._id || '',
      deadline: (val.deadline as Date).toISOString(),
    };

    const obs = this.data.task 
      ? this.taskApi.update(this.data.task._id, payload)
      : this.taskApi.create(payload as any);

    obs.subscribe({
      next: (res) => this.dialogRef.close(res),
      error: () => this.loading.set(false)
    });
  }
}

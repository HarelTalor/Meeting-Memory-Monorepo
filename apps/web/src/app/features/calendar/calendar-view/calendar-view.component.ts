import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import type { Meeting } from '@mm/shared-types';

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    FullCalendarModule,
  ],
  template: `
    <div class="calendar-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Calendar</h1>
          <p class="page-subtitle">{{ today | date:'EEEE, MMMM d, y' }}</p>
        </div>
        <div class="header-actions">
          <!-- Status filters -->
          <div class="status-filters">
            @for (s of statuses; track s.value) {
              <button
                class="filter-chip"
                [class.filter-chip--active]="activeStatus() === s.value"
                (click)="activeStatus.set(s.value)"
              >
                <span class="filter-chip__dot" [style.background]="s.color"></span>
                {{ s.label }}
              </button>
            }
          </div>
          <a routerLink="/app/meetings/new" id="new-meeting-btn">
            <button mat-flat-button color="primary" class="new-meeting-btn">
              <mat-icon>add</mat-icon>
              New Meeting
            </button>
          </a>
        </div>
      </div>

      <!-- Calendar -->
      <div class="calendar-wrapper card">
        <full-calendar [options]="calendarOptions()" />
      </div>

      <!-- Selected meeting panel -->
      @if (selectedMeeting()) {
        <div class="meeting-panel card fade-in-up">
          <div class="meeting-panel__header">
            <div>
              <h3 class="meeting-panel__title">{{ selectedMeeting()!.title }}</h3>
              <span class="badge badge--{{ selectedMeeting()!.status }}">{{ selectedMeeting()!.status }}</span>
            </div>
            <button mat-icon-button (click)="selectedMeeting.set(null)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <div class="meeting-panel__info">
            <div class="info-row">
              <mat-icon>schedule</mat-icon>
              {{ selectedMeeting()!.date | date:'mediumDate' }} · 
              {{ selectedMeeting()!.date | date:'h:mm a' }} - {{ (selectedMeeting()!.endDate || selectedMeeting()!.date) | date:'h:mm a' }}
            </div>
            @if (selectedMeeting()!.location) {
              <div class="info-row">
                <mat-icon>place</mat-icon>
                {{ selectedMeeting()!.location }}
              </div>
            }
            <div class="info-row">
              <mat-icon>people</mat-icon>
              {{ selectedMeeting()!.participants.length + (selectedMeeting()!.guestParticipants?.length || 0) }} participant(s)
            </div>
            <div class="info-row">
              <mat-icon>gavel</mat-icon>
              {{ selectedMeeting()!.decisions.length }} decision(s)
            </div>
          </div>
          @if (selectedMeeting()!.summary) {
            <p class="meeting-panel__summary">{{ selectedMeeting()!.summary }}</p>
          }
          <div class="meeting-panel__actions">
            <a [routerLink]="['/app/meetings', selectedMeeting()!._id]">
              <button mat-stroked-button color="primary" id="view-meeting-btn">View Details</button>
            </a>
            <a [routerLink]="['/app/meetings', selectedMeeting()!._id, 'edit']">
              <button mat-flat-button color="primary" id="edit-meeting-btn">
                <mat-icon>edit</mat-icon> Edit
              </button>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .calendar-page { display: flex; flex-direction: column; gap: 24px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;
      flex-wrap: wrap;
    }

    .page-subtitle { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }

    .header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

    .status-filters { display: flex; gap: 6px; }

    .filter-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.8rem; font-weight: 500;
      cursor: pointer; transition: var(--transition-fast);
      &:hover { border-color: var(--color-primary); color: var(--color-primary); }
      &--active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
    }

    .filter-chip__dot { width: 8px; height: 8px; border-radius: 50%; }

    .new-meeting-btn { border-radius: 10px !important; font-weight: 600; }

    .calendar-wrapper {
      padding: 16px;
      ::ng-deep {
        .fc { font-family: 'Inter', sans-serif; }
        .fc-toolbar-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
        .fc-button-group { gap: 8px; display: flex; }
        .fc-button-group > .fc-button { margin-left: 0 !important; border-radius: 8px !important; }
        .fc-toolbar-chunk { display: flex; align-items: center; gap: 12px; }

        .fc-col-header-cell { 
          padding: 12px 0 !important; 
          background: var(--bg-card) !important;
          border-bottom: 2px solid var(--border-color) !important;
        }
        .fc-col-header-cell-cushion, 
        .fc-col-header-cell a,
        .fc-col-header-cell span { 
          color: var(--text-primary) !important; 
          text-decoration: none !important; 
          font-weight: 700 !important;
          font-size: 0.8rem !important;
          text-transform: uppercase !important;
          letter-spacing: 1px !important;
        }
        .fc-day-today .fc-daygrid-day-number {
          background: var(--color-primary); color: white;
          border-radius: 50%; width: 26px; height: 26px;
          display: flex; align-items: center; justify-content: center;
        }
      }
    }

    .meeting-panel {
      padding: 20px;
      &__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
      &__title { font-size: 1.1rem; font-weight: 700; margin: 0 0 6px; }
      &__info { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
      &__summary { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.5; margin: 0 0 16px; }
      &__actions { display: flex; gap: 8px; }
    }

    .info-row {
      display: flex; align-items: center; gap: 8px;
      color: var(--text-secondary); font-size: 0.875rem;
      mat-icon { font-size: 18px; color: var(--color-primary); }
    }
  `],
})
export class CalendarViewComponent implements OnInit {
  private readonly meetingApi = inject(MeetingApiService);
  private readonly router = inject(Router);

  readonly today = new Date();
  readonly activeStatus = signal<string>('all');
  readonly meetings = signal<Meeting[]>([]);
  readonly selectedMeeting = signal<Meeting | null>(null);

  readonly statuses = [
    { label: 'All',       value: 'all',       color: '#64748b' },
    { label: 'Scheduled', value: 'scheduled', color: '#4f46e5' },
    { label: 'Completed', value: 'completed', color: '#10b981' },
    { label: 'Cancelled', value: 'cancelled', color: '#ef4444' },
  ];

  readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek',
    },
    selectable: true,
    editable: false,
    dayMaxEvents: 3,
    displayEventTime: false, // Hide the '3a' time prefix which can be confused with IDs
    events: this.toCalendarEvents(),
    select: this.onDateSelect.bind(this),
    eventClick: this.onEventClick.bind(this),
    height: 'auto',
  }));

  constructor() {
    // Re-load meetings whenever the status filter changes
    effect(() => {
      this.loadMeetings();
    });
  }

  ngOnInit(): void {
    // Initial load is handled by the effect above
  }

  private loadMeetings(): void {
    const status = this.activeStatus();
    const query = status !== 'all'
      ? { status: status as 'scheduled' | 'completed' | 'cancelled' }
      : {};
    
    this.meetingApi.list({ ...query, limit: 100 }).subscribe({
      next: (res) => this.meetings.set(res.data),
      error: console.error,
    });
  }

  private toCalendarEvents() {
    const colorMap: Record<string, string> = {
      scheduled: '#4f46e5',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return this.meetings().map((m) => ({
      id: m._id,
      title: m.title,
      start: m.date,
      end: m.endDate || undefined,
      backgroundColor: colorMap[m.status] ?? '#64748b',
      borderColor: colorMap[m.status] ?? '#64748b',
      extendedProps: { meeting: m },
    }));
  }

  private onDateSelect(arg: DateSelectArg): void {
    this.router.navigate(['/app/meetings/new'], { queryParams: { date: arg.startStr } });
  }

  private onEventClick(arg: EventClickArg): void {
    const meeting = arg.event.extendedProps['meeting'] as Meeting;
    this.selectedMeeting.set(meeting);
  }
}

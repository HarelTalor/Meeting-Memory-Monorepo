import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MeetingApiService } from '../../../core/api/meeting-api.service';
import type { Meeting } from '@mm/shared-types';

@Component({
  selector: 'app-search-view',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatInputModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatChipsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="search-page">
      <div class="page-header">
        <h1 class="page-title">Search</h1>
        <p class="page-sub">Find meetings, decisions, and summaries</p>
      </div>

      <!-- Search bar -->
      <div class="search-bar card">
        <mat-icon class="search-icon">search</mat-icon>
        <input
          class="search-input"
          [formControl]="searchCtrl"
          id="search-input"
          placeholder="Search by title, subject, summary, or keyword..."
          autocomplete="off"
        />
        @if (loading()) {
          <mat-spinner diameter="20" />
        }
        @if (searchCtrl.value) {
          <button mat-icon-button (click)="searchCtrl.setValue('')">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <!-- Filters -->
      <div class="filters">
        <mat-form-field appearance="outline" class="filter-select">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusCtrl" id="search-status-filter">
            <mat-option value="">All</mat-option>
            <mat-option value="scheduled">Scheduled</mat-option>
            <mat-option value="completed">Completed</mat-option>
            <mat-option value="cancelled">Cancelled</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Results -->
      @if (searchCtrl.value && !loading() && results().length === 0) {
        <div class="no-results">
          <mat-icon>search_off</mat-icon>
          <p>No meetings found for "<strong>{{ searchCtrl.value }}</strong>"</p>
        </div>
      }

      <div class="results-grid">
        @for (meeting of results(); track meeting._id) {
          <a [routerLink]="['/app/meetings', meeting._id]" class="result-card card" [id]="'result-' + meeting._id">
            <div class="result-card__header">
              <div class="result-card__title">{{ meeting.title }}</div>
              <span class="badge badge--{{ meeting.status }}">{{ meeting.status }}</span>
            </div>
            <div class="result-card__subject">{{ meeting.subject }}</div>
            <div class="result-card__meta">
              <div class="meta-chip">
                <mat-icon>schedule</mat-icon>
                {{ meeting.date | date:'shortDate' }} · {{ meeting.date | date:'h:mm' }}-{{ (meeting.endDate || meeting.date) | date:'h:mm' }}
              </div>
              @if (meeting.location) {
                <div class="meta-chip">
                  <mat-icon>place</mat-icon>
                  {{ meeting.location }}
                </div>
              }
              <div class="meta-chip">
                <mat-icon>people</mat-icon>
                {{ meeting.participants.length + (meeting.guestParticipants?.length || 0) }}
              </div>
              <div class="meta-chip">
                <mat-icon>gavel</mat-icon>
                {{ meeting.decisions.length }}
              </div>
            </div>
            @if (meeting.summary) {
              <p class="result-card__summary">{{ meeting.summary | slice:0:120 }}{{ meeting.summary.length > 120 ? '…' : '' }}</p>
            }
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .search-page { display: flex; flex-direction: column; gap: 20px; }
    .page-sub { color: var(--text-secondary); font-size: 0.875rem; margin: 4px 0 0; }

    .search-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px;
    }

    .search-icon { color: var(--text-muted); font-size: 22px; }

    .search-input {
      flex: 1;
      border: none; background: none; outline: none;
      font-size: 1rem; color: var(--text-primary);
      font-family: 'Inter', sans-serif;
      &::placeholder { color: var(--text-muted); }
    }

    .filters { display: flex; gap: 12px; }
    .filter-select { max-width: 200px; }

    .no-results {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 48px 0; color: var(--text-muted); text-align: center;
      mat-icon { font-size: 48px; opacity: 0.3; }
      p { margin: 0; font-size: 0.95rem; }
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .result-card {
      display: flex; flex-direction: column; gap: 10px;
      padding: 20px;
      text-decoration: none;
      color: var(--text-primary);
      cursor: pointer;
      transition: var(--transition-normal);
      &:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    }

    .result-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .result-card__title { font-size: 1rem; font-weight: 700; }
    .result-card__subject { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4; }
    .result-card__summary { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin: 0; }

    .result-card__meta { display: flex; gap: 12px; flex-wrap: wrap; }
    .meta-chip {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.75rem; color: var(--text-secondary);
      mat-icon { font-size: 14px; color: var(--color-primary); }
    }
  `],
})
export class SearchViewComponent {
  private readonly meetingApi = inject(MeetingApiService);

  readonly searchCtrl = new FormControl('');
  readonly statusCtrl = new FormControl('');
  readonly loading = signal(false);
  readonly results = signal<Meeting[]>([]);

  constructor() {
    // Initial search
    this.performSearch();

    // Trigger search when either search text or status changes
    import('rxjs').then(r => {
      r.merge(
        this.searchCtrl.valueChanges,
        this.statusCtrl.valueChanges
      ).pipe(
        r.debounceTime(350),
      ).subscribe(() => this.performSearch());
    });
  }

  private performSearch(): void {
    const term = this.searchCtrl.value;
    const status = this.statusCtrl.value;

    this.loading.set(true);
    
    // Clean up query: only include defined values
    const query: any = { limit: 30 };
    if (term) query.search = term;
    if (status) query.status = status;

    this.meetingApi.list(query).subscribe({
      next: (res) => {
        this.results.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('[search] Error fetching results:', err);
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }
}

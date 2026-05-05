import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'app/calendar',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar-view/calendar-view.component').then(
            (m) => m.CalendarViewComponent
          ),
      },
      {
        path: 'meetings/new',
        loadComponent: () =>
          import('./features/meetings/meeting-form/meeting-form.component').then(
            (m) => m.MeetingFormComponent
          ),
      },
      {
        path: 'meetings/:id',
        loadComponent: () =>
          import('./features/meetings/meeting-detail/meeting-detail.component').then(
            (m) => m.MeetingDetailComponent
          ),
      },
      {
        path: 'meetings/:id/edit',
        loadComponent: () =>
          import('./features/meetings/meeting-form/meeting-form.component').then(
            (m) => m.MeetingFormComponent
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./features/tasks/task-board/task-board.component').then(
            (m) => m.TaskBoardComponent
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/history/history-view/history-view.component').then(
            (m) => m.HistoryViewComponent
          ),
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./features/search/search-view/search-view.component').then(
            (m) => m.SearchViewComponent
          ),
      },
      { path: '', redirectTo: 'calendar', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'app/calendar' },
];

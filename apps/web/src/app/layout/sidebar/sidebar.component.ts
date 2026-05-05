import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';
import { SseService } from '../../core/sse/sse.service';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatRippleModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatSlideToggleModule,
  ],
  template: `
    <aside class="sidebar">
      <!-- Logo -->
      <div class="sidebar__logo">
        <div class="sidebar__logo-icon">
          <mat-icon>hub</mat-icon>
        </div>
        <span class="sidebar__logo-text">Meeting Memory</span>
      </div>

      <!-- Navigation -->
      <nav class="sidebar__nav">
        <span class="section-label" style="padding: 0 16px; margin-bottom: 8px; display: block;">Navigation</span>
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="sidebar__nav-item--active"
            class="sidebar__nav-item"
            matRipple
          >
            <mat-icon class="sidebar__nav-icon">{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Spacer -->
      <div style="flex: 1"></div>

      <!-- Notification bell -->
      <div class="sidebar__notifications" [matMenuTriggerFor]="notifMenu">
        <button class="sidebar__icon-btn" matRipple>
          <mat-icon
            [matBadge]="sse.unreadCount() || null"
            matBadgeColor="warn"
            matBadgeSize="small"
          >notifications</mat-icon>
        </button>
      </div>

      <mat-menu #notifMenu="matMenu" class="notif-menu">
        <div class="notif-header">
          <span>Notifications</span>
          @if (sse.unreadCount() > 0) {
            <button class="notif-clear" (click)="sse.clearUnread()">Mark all read</button>
          }
        </div>
        @if (sse.notifications().length === 0) {
          <div class="notif-empty">No notifications yet</div>
        }
        @for (n of sse.notifications().slice(0, 8); track n._id) {
          <div class="notif-item" [class.notif-item--unread]="!n.read">
            <mat-icon class="notif-icon">{{ getNotifIcon(n.type) }}</mat-icon>
            <div class="notif-content">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-msg">{{ n.message }}</div>
            </div>
          </div>
        }
      </mat-menu>

      <!-- User profile -->
      <div class="sidebar__user" [matMenuTriggerFor]="userMenu">
        <div class="sidebar__avatar" matRipple>
          @if (auth.currentUser()?.avatarUrl) {
            <img [src]="auth.currentUser()!.avatarUrl!" [alt]="auth.currentUser()!.displayName" />
          } @else {
            <span>{{ getInitials(auth.currentUser()?.displayName) }}</span>
          }
        </div>
        <div class="sidebar__user-info">
          <span class="sidebar__user-name">{{ auth.currentUser()?.displayName }}</span>
          <span class="sidebar__user-email">{{ auth.currentUser()?.email }}</span>
        </div>
        <mat-icon class="sidebar__user-chevron">expand_less</mat-icon>
      </div>

      <mat-menu #userMenu="matMenu">
        <div class="user-menu-header">
          <div class="user-menu-name">{{ auth.currentUser()?.displayName }}</div>
          <div class="user-menu-email">{{ auth.currentUser()?.email }}</div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item class="user-menu-theme-toggle">
          <mat-icon>{{ theme.theme() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
          <span>{{ theme.theme() === 'dark' ? 'Light Mode' : 'Dark Mode' }}</span>
          <mat-slide-toggle
            [checked]="theme.theme() === 'dark'"
            (change)="theme.toggle()"
            (click)="$event.stopPropagation()"
            color="primary"
          />
        </button>
        <button mat-menu-item (click)="onLogout()">
          <mat-icon color="warn">logout</mat-icon>
          <span>Sign Out</span>
        </button>
      </mat-menu>
    </aside>
  `,
  styles: [`
    :host { display: block; }

    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      padding: 16px 8px;
      gap: 4px;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
      overflow-y: auto;
    }

    .sidebar__logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px 24px;
    }

    .sidebar__logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      mat-icon { color: white; font-size: 20px; }
    }

    .sidebar__logo-text {
      font-size: 0.95rem;
      font-weight: 700;
      color: white;
      letter-spacing: -0.3px;
    }

    .sidebar__nav { display: flex; flex-direction: column; gap: 2px; }

    .sidebar__nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-radius: 10px;
      text-decoration: none;
      color: rgba(255,255,255,0.65);
      font-size: 0.875rem;
      font-weight: 500;
      transition: var(--transition-fast);
      cursor: pointer;

      &:hover { background: var(--bg-sidebar-hover); color: white; }
      &--active {
        background: rgba(79,70,229,0.25);
        color: white;
        .sidebar__nav-icon { color: var(--color-primary-light); }
      }
    }

    .sidebar__nav-icon { font-size: 20px; opacity: 0.9; }

    .sidebar__notifications {
      padding: 4px 8px;
      cursor: pointer;
    }

    .sidebar__icon-btn {
      display: flex; align-items: center; justify-content: center;
      width: 40px; height: 40px;
      background: var(--bg-sidebar-hover);
      border: none; border-radius: 10px; cursor: pointer;
      color: rgba(255,255,255,0.65);
      transition: var(--transition-fast);
      &:hover { background: rgba(255,255,255,0.12); color: white; }
      mat-icon { font-size: 22px; }
    }

    .sidebar__user {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      cursor: pointer;
      transition: var(--transition-fast);
      margin-top: 4px;
      &:hover { background: var(--bg-sidebar-hover); }
    }

    .sidebar__avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: white;
      overflow: hidden; flex-shrink: 0;
      img { width: 100%; height: 100%; object-fit: cover; }
    }

    .sidebar__user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar__user-name {
      font-size: 0.8rem; font-weight: 600;
      color: white; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .sidebar__user-email {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.45);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .sidebar__user-chevron { color: rgba(255,255,255,0.4); font-size: 18px; }

    /* Notification menu */
    .notif-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px 8px;
      font-weight: 600; font-size: 0.875rem; color: var(--text-primary);
    }
    .notif-clear {
      background: none; border: none; color: var(--color-primary);
      font-size: 0.75rem; cursor: pointer; font-weight: 500;
    }
    .notif-empty {
      padding: 24px 16px; text-align: center;
      color: var(--text-muted); font-size: 0.85rem;
    }
    .notif-item {
      display: flex; gap: 12px; padding: 10px 16px;
      border-left: 3px solid transparent; transition: var(--transition-fast);
      &--unread { border-left-color: var(--color-primary); background: rgba(79,70,229,0.04); }
    }
    .notif-icon { font-size: 20px; color: var(--color-primary); flex-shrink: 0; }
    .notif-title { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
    .notif-msg   { font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; }

    /* User menu header */
    .user-menu-header { padding: 12px 16px 8px; }
    .user-menu-name { font-weight: 600; font-size: 0.875rem; }
    .user-menu-email { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .user-menu-theme-toggle {
      display: flex !important;
      align-items: center;
      gap: 8px;
      justify-content: space-between;
    }
  `],
})
export class SidebarComponent {
  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  readonly sse = inject(SseService);

  readonly navItems: NavItem[] = [
    { label: 'Calendar',     icon: 'calendar_month',  route: '/app/calendar' },
    { label: 'My Tasks',     icon: 'task_alt',         route: '/app/tasks' },
    { label: 'History',      icon: 'history',          route: '/app/history' },
    { label: 'Search',       icon: 'search',           route: '/app/search' },
  ];

  getInitials(name?: string): string {
    const fallback = name || 'User';
    return fallback.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getNotifIcon(type: string): string {
    const map: Record<string, string> = {
      meeting_reminder: 'event',
      task_deadline:    'assignment_late',
      participant_added: 'person_add',
      meeting_updated:  'edit_calendar',
      task_assigned:    'assignment',
    };
    return map[type] ?? 'notifications';
  }

  onLogout(): void {
    this.auth.logout().subscribe();
  }
}

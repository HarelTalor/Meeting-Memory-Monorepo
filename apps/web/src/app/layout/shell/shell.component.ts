import { Component, inject, OnInit, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SseService } from '../../core/sse/sse.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, MatSnackBarModule],
  template: `
    <div class="layout">
      <app-sidebar />
      <main class="main-content fade-in-up">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .layout { display: flex; height: 100%; overflow: hidden; }
    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      background: var(--bg-app);
      transition: var(--transition-normal);
    }
  `],
})
export class ShellComponent implements OnInit {
  private readonly sse = inject(SseService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    // Show a snackbar when a new notification arrives
    effect(() => {
      const notifications = this.sse.notifications();
      if (notifications.length > 0) {
        const latest = notifications[0];
        // Only show for unread ones (usually the first one in the signal)
        if (!latest.read) {
          this.snackBar.open(latest.message, 'View', {
            duration: 5000,
            horizontalPosition: 'right',
            verticalPosition: 'bottom'
          });
        }
      }
    });
  }

  ngOnInit(): void { this.sse.connect(); }
}

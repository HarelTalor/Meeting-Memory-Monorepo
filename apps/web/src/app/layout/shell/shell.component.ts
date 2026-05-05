import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SseService } from '../../core/sse/sse.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
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
  ngOnInit(): void { this.sse.connect(); }
}

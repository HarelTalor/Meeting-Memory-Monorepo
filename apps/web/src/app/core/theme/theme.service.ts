import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly theme = signal<Theme>(this.loadTheme());

  toggle(): void {
    const next: Theme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    if (this.isBrowser) {
      localStorage.setItem('mm_theme', next);
    }
    this.applyTheme(next);
  }

  init(): void { this.applyTheme(this.theme()); }

  private applyTheme(theme: Theme): void {
    if (this.isBrowser) {
      document.body.classList.toggle('dark-theme', theme === 'dark');
    }
  }

  private loadTheme(): Theme {
    if (!this.isBrowser) {
      return 'light';
    }
    return (localStorage.getItem('mm_theme') as Theme | null) ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
}

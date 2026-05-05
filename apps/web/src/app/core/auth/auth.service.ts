import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthResponse, User, LoginDto, RegisterDto } from '@mm/shared-types';

const TOKEN_KEY = 'mm_access_token';
const REFRESH_KEY = 'mm_refresh_token';
const USER_KEY = 'mm_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly base = `${environment.apiUrl}/auth`;

  // ── Signals ──────────────────────────────────────────────────────────────────
  readonly currentUser = signal<User | null>(this.loadUser());
  readonly accessToken = signal<string | null>(this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null);
  readonly isAuthenticated = computed(() => !!this.accessToken() && !!this.currentUser());

  // ── Auth actions ──────────────────────────────────────────────────────────────
  register(dto: RegisterDto) {
    return this.http.post<AuthResponse>(`${this.base}/register`, dto).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  login(dto: LoginDto) {
    return this.http.post<AuthResponse>(`${this.base}/login`, dto).pipe(
      tap((res) => this.storeSession(res))
    );
  }

  logout() {
    return this.http.post(`${this.base}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((err) => { this.clearSession(); return throwError(() => err); })
    );
  }

  refreshToken() {
    const userId = this.currentUser()?._id;
    const refreshToken = this.isBrowser ? localStorage.getItem(REFRESH_KEY) : null;
    if (!userId || !refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.base}/refresh`,
      { userId, refreshToken }
    ).pipe(tap((res) => {
      this.accessToken.set(res.accessToken);
      if (this.isBrowser) {
        localStorage.setItem(TOKEN_KEY, res.accessToken);
        localStorage.setItem(REFRESH_KEY, res.refreshToken);
      }
    }));
  }

  getToken(): string | null { return this.accessToken(); }

  // ── Private helpers ───────────────────────────────────────────────────────────
  private storeSession(res: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(TOKEN_KEY, res.accessToken);
      localStorage.setItem(REFRESH_KEY, res.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    }
    this.accessToken.set(res.accessToken);
    this.currentUser.set(res.user);
  }

  private clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.accessToken.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): User | null {
    if (!this.isBrowser) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch { return null; }
  }
}

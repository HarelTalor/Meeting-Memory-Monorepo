import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="auth-bg__orb auth-bg__orb--1"></div>
        <div class="auth-bg__orb auth-bg__orb--2"></div>
      </div>

      <div class="auth-card fade-in-up">
        <!-- Logo -->
        <div class="auth-logo">
          <div class="auth-logo__icon">
            <mat-icon>hub</mat-icon>
          </div>
          <h1 class="auth-logo__title">Meeting Memory</h1>
          <p class="auth-logo__sub">Sign in to your workspace</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" id="login-email" autocomplete="email" />
            <mat-icon matSuffix>mail</mat-icon>
            @if (form.get('email')?.touched && form.get('email')?.invalid) {
              <mat-error>Please enter a valid email</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              id="login-password"
              autocomplete="current-password"
            />
            <button mat-icon-button matSuffix type="button" (click)="showPassword.update(v => !v)">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <mat-error>Password is required</mat-error>
            }
          </mat-form-field>

          @if (error()) {
            <div class="auth-error">
              <mat-icon>error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          <button
            mat-flat-button
            color="primary"
            type="submit"
            id="login-submit"
            class="auth-submit"
            [disabled]="loading() || form.invalid"
          >
            @if (loading()) {
              <mat-spinner diameter="20" color="accent" />
            } @else {
              Sign In
            }
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account?
          <a routerLink="/auth/register" id="go-register">Create account</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      background: var(--bg-app);
      padding: 24px;
    }

    .auth-bg {
      position: fixed;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }

    .auth-bg__orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.25;
    }

    .auth-bg__orb--1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, #4f46e5, transparent);
      top: -150px; left: -100px;
    }

    .auth-bg__orb--2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, #ec4899, transparent);
      bottom: -100px; right: -100px;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-lg);
      padding: 40px;
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-logo__icon {
      width: 56px; height: 56px;
      background: linear-gradient(135deg, #4f46e5, #ec4899);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 8px 24px rgba(79,70,229,0.35);
      mat-icon { color: white; font-size: 28px; }
    }

    .auth-logo__title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 6px;
      letter-spacing: -0.5px;
    }

    .auth-logo__sub {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .auth-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px;
      color: var(--color-danger);
      font-size: 0.85rem;
      mat-icon { font-size: 18px; }
    }

    .auth-submit {
      height: 46px;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 10px !important;
      margin-top: 4px;
      display: flex; align-items: center; justify-content: center;
    }

    .auth-footer {
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 20px 0 0;
      a { color: var(--color-primary); font-weight: 500; text-decoration: none;
        &:hover { text-decoration: underline; } }
    }
  `],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue() as { email: string; password: string }).subscribe({
      next: () => this.router.navigate(['/app/calendar']),
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Invalid credentials. Please try again.');
        this.loading.set(false);
      },
    });
  }
}

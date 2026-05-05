import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="auth-bg__orb auth-bg__orb--1"></div>
        <div class="auth-bg__orb auth-bg__orb--2"></div>
      </div>

      <div class="auth-card fade-in-up">
        <div class="auth-logo">
          <div class="auth-logo__icon"><mat-icon>hub</mat-icon></div>
          <h1 class="auth-logo__title">Create Account</h1>
          <p class="auth-logo__sub">Join your organization's workspace</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="displayName" id="reg-name" autocomplete="name" />
            <mat-icon matSuffix>person</mat-icon>
            @if (form.get('displayName')?.touched && form.get('displayName')?.invalid) {
              <mat-error>Display name must be at least 2 characters</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" id="reg-email" autocomplete="email" />
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
              id="reg-password"
              autocomplete="new-password"
            />
            <button mat-icon-button matSuffix type="button" (click)="showPassword.update(v => !v)">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <mat-error>Password must be 8+ chars with uppercase and number</mat-error>
            }
          </mat-form-field>

          @if (error()) {
            <div class="auth-error">
              <mat-icon>error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          <button mat-flat-button color="primary" type="submit" id="reg-submit" class="auth-submit"
            [disabled]="loading() || form.invalid">
            @if (loading()) { <mat-spinner diameter="20" color="accent" /> }
            @else { Create Account }
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/auth/login" id="go-login">Sign in</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    /* Inherits all styles from login via global SCSS */
  `],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])/),
    ]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue() as { displayName: string; email: string; password: string }).subscribe({
      next: () => this.router.navigate(['/app/calendar']),
      error: (err) => {
        this.error.set(err?.error?.detail ?? 'Registration failed. Please try again.');
        this.loading.set(false);
      },
    });
  }
}

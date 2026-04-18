import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="login-page">
      <div class="login-brand">
        <mat-icon class="brand-icon">bug_report</mat-icon>
        <h1>BugTracker</h1>
        <p>Modern project management for your team</p>
      </div>

      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Sign in</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form (ngSubmit)="login()" #form="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" name="email" [(ngModel)]="email" required autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPw() ? 'text' : 'password'" name="password" [(ngModel)]="password" required autocomplete="current-password">
              <button mat-icon-button matSuffix type="button" (click)="showPw.set(!showPw())">
                <mat-icon>{{ showPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (error()) {
              <div class="login-error">
                <mat-icon>error_outline</mat-icon>
                {{ error() }}
              </div>
            }

            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn" [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Sign in
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #1b1a19 0%, #2d2c2b 50%, #1b1a19 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .login-brand {
      text-align: center;
      margin-bottom: 32px;
      color: white;
    }
    .brand-icon { font-size: 48px; width: 48px; height: 48px; color: var(--color-primary); margin-bottom: 8px; }
    .login-brand h1 { margin: 8px 0 4px; font-size: 28px; font-weight: 700; }
    .login-brand p { margin: 0; color: rgba(255,255,255,0.6); font-size: 14px; }
    .login-card {
      width: 100%;
      max-width: 400px;
      border-radius: 12px !important;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
    }
    mat-card-header { padding-bottom: 8px; }
    mat-card-title { font-size: 20px !important; font-weight: 600 !important; }
    mat-card-content { padding-top: 8px; }
    .full-width { width: 100%; }
    .submit-btn { height: 44px; margin-top: 8px; font-size: 15px; }
    .submit-btn mat-spinner { display: inline-block; }
    .login-error {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d83b01;
      font-size: 13px;
      background: #fdf2ec;
      padding: 10px 12px;
      border-radius: 4px;
      margin-bottom: 12px;
    }
    .login-error mat-icon { font-size: 18px; }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  showPw = signal(false);
  loading = signal(false);
  error = signal('');

  async login(): Promise<void> {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email, this.password);
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
      this.router.navigateByUrl(returnUrl);
    } catch (e: any) {
      this.error.set(e.message || 'Login failed');
    } finally {
      this.loading.set(false);
    }
  }
}

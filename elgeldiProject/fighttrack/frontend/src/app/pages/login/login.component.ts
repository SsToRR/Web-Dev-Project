import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-grid"></div>
      </div>

      <div class="login-card">
        <div class="login-header">
          <div class="logo-mark">FT</div>
          <h1>FIGHT<span class="accent">TRACK</span></h1>
          <p>Платформа для бойцов, спаррингов и истории боёв</p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-error">
            <span class="alert-icon">!</span>
            {{ errorMessage }}
          </div>
        }

        @if (successMessage) {
          <div class="alert alert-success">
            <span class="alert-icon">OK</span>
            {{ successMessage }}
          </div>
        }

        <form class="login-form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Логин</label>
            <div class="input-wrapper">
              <span class="input-icon">ID</span>
              <input
                id="username"
                type="text"
                [(ngModel)]="username"
                name="username"
                placeholder="Введите логин"
                required
                autocomplete="username"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="password">Пароль</label>
            <div class="input-wrapper">
              <span class="input-icon">PW</span>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Введите пароль"
                required
                autocomplete="current-password"
              />
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="isLoading">
            @if (isLoading) {
              <span class="spinner"></span> Входим...
            } @else {
              Войти в систему
            }
          </button>
        </form>

        <div class="login-footer">
          <p class="login-switch">
            Нет аккаунта?
            <a routerLink="/register">Зарегистрировать бойца</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: calc(100vh - 90px);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      padding: 24px 16px;
    }

    .login-bg { position: fixed; inset: 0; z-index: 0; }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.07;
    }

    .orb-1 {
      width: 500px;
      height: 500px;
      background: var(--accent);
      top: -110px;
      left: -110px;
    }

    .orb-2 {
      width: 420px;
      height: 420px;
      background: var(--accent-secondary);
      bottom: -100px;
      right: -90px;
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
      background-size: 40px 40px;
    }

    .login-card {
      position: relative;
      z-index: 1;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 42px;
      width: min(440px, 100%);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      animation: slideUp .35s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo-mark {
      width: 68px;
      height: 68px;
      margin: 0 auto 14px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      color: var(--accent-contrast);
      font-weight: 800;
      letter-spacing: 1px;
    }

    .login-header h1 {
      font-family: var(--font-display);
      font-size: 2rem;
      letter-spacing: 4px;
      margin-bottom: 8px;
    }

    .login-header p {
      color: var(--text-muted);
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 18px;
      font-size: 0.92rem;
    }

    .alert-error {
      background: var(--danger-soft);
      border: 1px solid var(--danger-border);
      color: var(--danger-text);
    }

    .alert-success {
      background: var(--success-soft);
      border: 1px solid var(--success-border);
      color: var(--success-text);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 1px;
    }

    .input-wrapper input {
      width: 100%;
      padding: 13px 16px 13px 48px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-size: 1rem;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .btn-primary {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      color: var(--accent-contrast);
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      letter-spacing: 0.5px;
      transition: transform .2s ease, box-shadow .2s ease;
      margin-top: 4px;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(255, 0, 0, 0.28);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 243, 243, 0.32);
      border-top-color: var(--accent-contrast);
      border-radius: 50%;
      animation: spin .6s linear infinite;
      margin-right: 6px;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .login-footer {
      margin-top: 20px;
      text-align: center;
    }

    .login-hint,
    .login-switch {
      color: var(--text-muted);
      font-size: 0.88rem;
    }

    .login-switch {
      margin-top: 8px;
    }

    .login-switch a {
      color: var(--accent-secondary);
      font-weight: 700;
      text-decoration: none;
    }

    @media (max-width: 560px) {
      .login-card {
        padding: 28px 22px;
      }
    }
  `],
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Заполните все поля.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.successMessage = 'Добро пожаловать.';
        setTimeout(() => this.router.navigate(['/fights']), 500);
      },
      error: (err) => {
        this.isLoading = false;
        const detail = err?.error?.non_field_errors?.[0]
          || err?.error?.detail
          || 'Неверный логин или пароль.';
        this.errorMessage = detail;
      },
    });
  }
}

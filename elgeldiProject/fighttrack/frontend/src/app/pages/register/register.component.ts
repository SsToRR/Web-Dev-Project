import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-orb orb-1"></div>
        <div class="bg-orb orb-2"></div>
        <div class="bg-grid"></div>
      </div>

      <div class="auth-card auth-card--wide">
        <div class="auth-header">
          <div class="logo-mark">FT</div>
          <h1>Регистрация бойца</h1>
          <p>Создайте профиль с физическими параметрами и сразу попадите в систему.</p>
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

        <form class="register-form" (ngSubmit)="onSubmit()">
          <div class="form-grid">
            <div class="form-group">
              <label for="username">Логин</label>
              <input id="username" [(ngModel)]="form.username" name="username" type="text" placeholder="fighter_name" required />
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input id="email" [(ngModel)]="form.email" name="email" type="email" placeholder="fighter@mail.com" />
            </div>

            <div class="form-group">
              <label for="city">Город</label>
              <input id="city" [(ngModel)]="form.city" name="city" type="text" placeholder="Алматы" />
            </div>

            <div class="form-group">
              <label for="experience">Уровень</label>
              <select id="experience" [(ngModel)]="form.experience_level" name="experience_level">
                <option [ngValue]="1">Новичок</option>
                <option [ngValue]="2">Любитель</option>
                <option [ngValue]="3">Средний</option>
                <option [ngValue]="4">Продвинутый</option>
                <option [ngValue]="5">Профессионал</option>
              </select>
            </div>

            <div class="form-group">
              <label for="weight">Вес, кг</label>
              <input id="weight" [(ngModel)]="form.weight_kg" name="weight_kg" type="number" min="30" step="0.1" placeholder="72.5" />
            </div>

            <div class="form-group">
              <label for="height">Рост, см</label>
              <input id="height" [(ngModel)]="form.height_cm" name="height_cm" type="number" min="120" max="250" placeholder="180" />
            </div>

            <div class="form-group">
              <label for="avatar">Аватар URL</label>
              <input id="avatar" [(ngModel)]="form.avatar_url" name="avatar_url" type="url" placeholder="https://..." />
            </div>

            <div class="form-group form-group--full">
              <label for="achievements">Достижения</label>
              <textarea id="achievements" [(ngModel)]="form.achievements" name="achievements" rows="3" placeholder="Турниры, пояса, специализация"></textarea>
            </div>

            <div class="form-group">
              <label for="password">Пароль</label>
              <input id="password" [(ngModel)]="form.password" name="password" type="password" placeholder="Минимум 6 символов" required />
            </div>

            <div class="form-group">
              <label for="password_confirm">Подтверждение</label>
              <input id="password_confirm" [(ngModel)]="form.password_confirm" name="password_confirm" type="password" placeholder="Повторите пароль" required />
            </div>
          </div>

          <button type="submit" class="btn-primary" [disabled]="isLoading">
            @if (isLoading) {
              <span class="spinner"></span> Создаём профиль...
            } @else {
              Зарегистрироваться
            }
          </button>
        </form>

        <p class="auth-switch">
          Уже есть аккаунт?
          <a routerLink="/login">Войти</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: calc(100vh - 90px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      position: relative;
      overflow: hidden;
    }

    .auth-bg { position: fixed; inset: 0; z-index: 0; }

    .bg-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.08;
    }

    .orb-1 {
      width: 520px;
      height: 520px;
      background: var(--accent);
      top: -140px;
      left: -120px;
    }

    .orb-2 {
      width: 420px;
      height: 420px;
      background: var(--accent-secondary);
      bottom: -100px;
      right: -80px;
    }

    .bg-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: 44px 44px;
    }

    .auth-card {
      position: relative;
      z-index: 1;
      width: min(760px, 100%);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 36px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
      animation: slideUp .35s ease;
    }

    .auth-card--wide {
      width: min(860px, 100%);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .auth-header {
      margin-bottom: 28px;
      text-align: center;
    }

    .logo-mark {
      width: 64px;
      height: 64px;
      margin: 0 auto 14px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      color: var(--accent-contrast);
      font-weight: 800;
      letter-spacing: 1px;
      font-size: 1.15rem;
    }

    .auth-header h1 {
      font-family: var(--font-display);
      font-size: 2rem;
      letter-spacing: 2px;
      margin-bottom: 6px;
    }

    .auth-header p {
      color: var(--text-muted);
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group--full {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 12px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      resize: vertical;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .btn-primary {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      color: var(--accent-contrast);
      font-weight: 800;
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(255, 0, 0, 0.28);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 12px;
      margin-bottom: 18px;
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

    .auth-switch {
      text-align: center;
      color: var(--text-muted);
      margin-top: 20px;
    }

    .auth-switch a {
      color: var(--accent-secondary);
      text-decoration: none;
      font-weight: 700;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      margin-right: 6px;
      border: 2px solid rgba(255, 243, 243, 0.32);
      border-top-color: var(--accent-contrast);
      border-radius: 50%;
      vertical-align: middle;
      animation: spin .7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 720px) {
      .auth-card {
        padding: 24px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class RegisterComponent {
  form = {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    experience_level: 1,
    achievements: '',
    weight_kg: null as number | null,
    height_cm: null as number | null,
    city: '',
    avatar_url: '',
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.form.username || !this.form.password || !this.form.password_confirm) {
      this.errorMessage = 'Заполните логин и пароль.';
      return;
    }

    if (this.form.password !== this.form.password_confirm) {
      this.errorMessage = 'Пароли не совпадают.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.register(this.form).subscribe({
      next: () => {
        this.successMessage = 'Профиль создан. Перенаправляем в систему.';
        setTimeout(() => this.router.navigate(['/fights']), 500);
      },
      error: (err) => {
        this.isLoading = false;
        const firstError = Object.values(err?.error || {}).flat()?.[0];
        this.errorMessage = typeof firstError === 'string' ? firstError : 'Не удалось зарегистрировать бойца.';
      },
    });
  }
}

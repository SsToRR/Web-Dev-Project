import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, FighterProfile, UpdateProfileRequest } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      @if (isLoading) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загружаем профиль бойца...</p>
        </div>
      } @else if (profile) {
        <div class="page-header">
          <div class="hero-card">
            <div class="hero-avatar">
              @if (profile.avatar_url) {
                <img [src]="profile.avatar_url" [alt]="profile.username" />
              } @else {
                <span>{{ profile.username[0].toUpperCase() }}</span>
              }
            </div>

            <div class="hero-copy">
              <span class="eyebrow">Личный кабинет</span>
              <h1>{{ profile.username }}</h1>
              <p>{{ profile.city || 'Город не указан' }} · {{ profile.experience_label }}</p>
              <div class="hero-badges">
                <span>Рейтинг {{ profile.rating }}</span>
                <span>{{ profile.total_fights }} спаррингов</span>
                @if (profile.weight_category_label) {
                  <span>{{ profile.weight_category_label }}</span>
                }
                @if (profile.height_cm) {
                  <span>{{ profile.height_cm }} см</span>
                }
              </div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <strong>{{ profile.rating }}</strong>
              <span>Текущий рейтинг</span>
            </div>
            <div class="stat-card">
              <strong>{{ profile.total_fights }}</strong>
              <span>Принятые вызовы</span>
            </div>
            <div class="stat-card">
              <strong>{{ profile.weight_kg || '—' }}</strong>
              <span>Вес, кг</span>
            </div>
          </div>
        </div>

        <div class="content-grid">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h2>Основные данные</h2>
                <p>Заполненный профиль улучшает подбор соперников и рейтинг-лист.</p>
              </div>
            </div>

            @if (notification) {
              <div class="alert" [class.alert-success]="notification.type === 'success'" [class.alert-error]="notification.type === 'error'">
                {{ notification.message }}
              </div>
            }

            <form class="profile-form" (ngSubmit)="saveProfile()">
              <div class="form-grid">
                <div class="form-group">
                  <label for="username">Логин</label>
                  <input id="username" [(ngModel)]="form.username" name="username" type="text" required />
                </div>

                <div class="form-group">
                  <label for="email">Email</label>
                  <input id="email" [(ngModel)]="form.email" name="email" type="email" />
                </div>

                <div class="form-group">
                  <label for="city">Город</label>
                  <input id="city" [(ngModel)]="form.city" name="city" type="text" />
                </div>

                <div class="form-group">
                  <label for="weight">Вес, кг</label>
                  <input id="weight" [(ngModel)]="form.weight_kg" name="weight_kg" type="number" min="30" step="0.1" />
                </div>

                <div class="form-group">
                  <label for="height">Рост, см</label>
                  <input id="height" [(ngModel)]="form.height_cm" name="height_cm" type="number" min="120" max="250" />
                </div>

                <div class="form-group">
                  <label for="experience">Уровень подготовки</label>
                  <select id="experience" [(ngModel)]="form.experience_level" name="experience_level">
                    <option [ngValue]="1">Новичок</option>
                    <option [ngValue]="2">Любитель</option>
                    <option [ngValue]="3">Средний</option>
                    <option [ngValue]="4">Продвинутый</option>
                    <option [ngValue]="5">Профессионал</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="avatar">Аватар URL</label>
                  <input id="avatar" [(ngModel)]="form.avatar_url" name="avatar_url" type="url" />
                </div>

                <div class="form-group form-group--full">
                  <label for="achievements">Достижения</label>
                  <textarea id="achievements" [(ngModel)]="form.achievements" name="achievements" rows="5"></textarea>
                </div>
              </div>

              <button class="btn-primary" type="submit" [disabled]="isSaving">
                @if (isSaving) {
                  <span class="spinner"></span> Сохраняем...
                } @else {
                  Сохранить профиль
                }
              </button>
            </form>
          </section>

          <aside class="panel panel--side">
            <h2>Ключевые параметры</h2>
            <ul class="tips-list">
              <li>Рост и вес влияют на весовую категорию в матчмейкинге.</li>
              <li>Достижения и опыт помогают точнее показывать вас в рейтинге.</li>
              <li>Актуальный профиль повышает шанс получить принятый вызов.</li>
            </ul>

            <div class="quote-card">
              <span class="quote-label">Категория</span>
              <p>{{ profile.weight_category_label || 'Недостаточно данных для расчета весовой категории.' }}</p>
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 48px;
    }

    .loading-state {
      text-align: center;
      padding: 120px 24px;
      color: var(--text-muted);
    }

    .loading-spinner {
      width: 42px;
      height: 42px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      margin: 0 auto 14px;
      animation: spin .8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .page-header {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .hero-card,
    .panel,
    .stat-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      box-shadow: var(--shadow);
    }

    .hero-card {
      padding: 28px;
      display: flex;
      align-items: center;
      gap: 20px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 38%),
        var(--surface);
    }

    .hero-avatar {
      width: 92px;
      height: 92px;
      border-radius: 28px;
      overflow: hidden;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .hero-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-avatar span {
      color: var(--accent-contrast);
      font-size: 2rem;
      font-weight: 800;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--accent);
      font-size: 0.78rem;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .hero-copy h1 {
      font-family: var(--font-display);
      font-size: 2.25rem;
      letter-spacing: 2px;
      line-height: 1;
      margin-bottom: 8px;
    }

    .hero-copy p {
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .hero-badges span {
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      font-size: 0.85rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
    }

    .stat-card {
      padding: 22px 18px;
      text-align: center;
    }

    .stat-card strong {
      display: block;
      font-family: var(--font-display);
      font-size: 2rem;
      letter-spacing: 1px;
      color: var(--accent);
    }

    .stat-card span {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1.5fr 0.9fr;
      gap: 20px;
    }

    .panel {
      padding: 28px;
    }

    .panel-head h2,
    .panel h2 {
      margin-bottom: 6px;
      font-size: 1.2rem;
    }

    .panel-head p {
      color: var(--text-muted);
      margin-bottom: 20px;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
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
      border-radius: 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text);
      resize: vertical;
    }

    .btn-primary {
      align-self: flex-start;
      padding: 12px 20px;
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
      box-shadow: 0 10px 28px rgba(255, 0, 0, 0.24);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .tips-list {
      list-style: none;
      display: grid;
      gap: 12px;
      margin: 18px 0 24px;
    }

    .tips-list li {
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      color: var(--text-muted);
    }

    .quote-card {
      padding: 18px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(149, 1, 1, 0.12));
      border: 1px solid var(--border);
    }

    .quote-label {
      display: inline-block;
      margin-bottom: 10px;
      color: var(--accent);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .quote-card p {
      color: var(--text);
    }

    .alert {
      margin-bottom: 18px;
      padding: 12px 14px;
      border-radius: 12px;
    }

    .alert-success {
      background: var(--success-soft);
      border: 1px solid var(--success-border);
      color: var(--success-text);
    }

    .alert-error {
      background: var(--danger-soft);
      border: 1px solid var(--danger-border);
      color: var(--danger-text);
    }

    @media (max-width: 960px) {
      .page-header,
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 720px) {
      .page-wrap {
        padding: 24px 16px 40px;
      }

      .hero-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .stats-grid,
      .form-grid {
        grid-template-columns: 1fr;
      }

      .btn-primary {
        width: 100%;
      }
    }
  `],
})
export class ProfileComponent implements OnInit {
  profile: FighterProfile | null = null;
  isLoading = true;
  isSaving = false;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  form: UpdateProfileRequest = {
    username: '',
    email: '',
    city: '',
    weight_kg: null,
    height_cm: null,
    experience_level: 1,
    achievements: '',
    avatar_url: '',
  };

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.auth.updateUser(profile);
        this.form = {
          username: profile.username,
          email: profile.email,
          city: profile.city,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          experience_level: profile.experience_level,
          achievements: profile.achievements,
          avatar_url: profile.avatar_url,
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('Не удалось загрузить профиль.', 'error');
      },
    });
  }

  saveProfile() {
    this.isSaving = true;
    this.notification = null;

    this.api.updateMyProfile(this.form).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.auth.updateUser(profile);
        this.isSaving = false;
        this.showNotification('Профиль обновлён.', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        const firstError = Object.values(err?.error || {}).flat()?.[0];
        this.showNotification(typeof firstError === 'string' ? firstError : 'Не удалось сохранить профиль.', 'error');
      },
    });
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => (this.notification = null), 4000);
  }
}

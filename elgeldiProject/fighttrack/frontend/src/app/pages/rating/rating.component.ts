import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, FighterProfile, LeaderboardFilters, MartialArt } from '../../services/api.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <span class="eyebrow">Leaderboard</span>
          <h1>Рейтинг бойцов</h1>
          <p>Лидеры по рейтингу с фильтрами по виду спорта, длительности тренировок и весовой категории.</p>
        </div>
      </div>

      <section class="filters-card">
        <div class="filters-grid">
          <div class="form-group">
            <label for="martialArt">Вид спорта</label>
            <select id="martialArt" [(ngModel)]="filters.martial_art_id" name="martial_art_id">
              <option [ngValue]="null">Любой</option>
              @for (art of martialArts; track art.id) {
                <option [ngValue]="art.id">{{ art.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label for="experience">Уровень</label>
            <select id="experience" [(ngModel)]="filters.experience_level" name="experience_level">
              <option [ngValue]="null">Любой</option>
              <option [ngValue]="1">Новичок</option>
              <option [ngValue]="2">Любитель</option>
              <option [ngValue]="3">Средний</option>
              <option [ngValue]="4">Продвинутый</option>
              <option [ngValue]="5">Профессионал</option>
            </select>
          </div>

          <div class="form-group">
            <label for="weightCategory">Весовая категория</label>
            <select id="weightCategory" [(ngModel)]="filters.weight_category" name="weight_category">
              <option [ngValue]="null">Любая</option>
              <option value="light">Легкая</option>
              <option value="middle">Средняя</option>
              <option value="heavy">Тяжелая</option>
              <option value="super_heavy">Супертяжелая</option>
            </select>
          </div>

          <div class="form-group">
            <label for="minDuration">Мин. длительность</label>
            <input id="minDuration" [(ngModel)]="filters.min_duration" name="min_duration" type="number" min="15" max="300" step="15" />
          </div>

          <div class="form-group">
            <label for="maxDuration">Макс. длительность</label>
            <input id="maxDuration" [(ngModel)]="filters.max_duration" name="max_duration" type="number" min="15" max="300" step="15" />
          </div>
        </div>

        <div class="filter-actions">
          <button class="accent-btn" (click)="loadLeaderboard()" [disabled]="isLoading">Применить</button>
          <button class="ghost-btn" (click)="resetFilters()" [disabled]="isLoading">Сбросить</button>
        </div>
      </section>

      @if (errorMessage) {
        <div class="alert alert-error">{{ errorMessage }}</div>
      }

      @if (isLoading) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Собираем рейтинг...</p>
        </div>
      } @else {
        <section class="rating-list">
          @for (fighter of fighters; track fighter.id; let idx = $index) {
            <article class="rating-card">
              <div class="rank">{{ idx + 1 }}</div>
              <div class="avatar">
                @if (fighter.avatar_url) {
                  <img [src]="fighter.avatar_url" [alt]="fighter.username" />
                } @else {
                  <span>{{ fighter.username[0].toUpperCase() }}</span>
                }
              </div>

              <div class="fighter-main">
                <h2>{{ fighter.username }}</h2>
                <p>{{ fighter.experience_label }} · {{ fighter.city || 'Без города' }}</p>
                <div class="meta-tags">
                  <span>Рейтинг {{ fighter.rating }}</span>
                  <span>{{ fighter.total_fights }} принятых вызовов</span>
                  @if (fighter.weight_category_label) {
                    <span>{{ fighter.weight_category_label }}</span>
                  }
                  @if (fighter.height_cm) {
                    <span>{{ fighter.height_cm }} см</span>
                  }
                </div>
              </div>

              <div class="fighter-side">
                <strong>{{ fighter.rating }}</strong>
                <small>rating</small>
              </div>
            </article>
          }
        </section>

        @if (!fighters.length) {
          <div class="empty-state">
            <span class="empty-icon">/</span>
            <p>По выбранным фильтрам бойцы не найдены.</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px 48px;
    }

    .page-header {
      margin-bottom: 22px;
    }

    .eyebrow {
      display: inline-flex;
      margin-bottom: 10px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--accent);
      font-size: 0.78rem;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .page-header h1 {
      font-family: var(--font-display);
      font-size: 2.6rem;
      letter-spacing: 2px;
      margin-bottom: 8px;
    }

    .page-header p {
      color: var(--text-muted);
      max-width: 780px;
    }

    .filters-card,
    .rating-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      box-shadow: var(--shadow);
    }

    .filters-card {
      padding: 24px;
      margin-bottom: 22px;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 0.8rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text);
    }

    .filter-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .rating-list {
      display: grid;
      gap: 14px;
    }

    .rating-card {
      display: grid;
      grid-template-columns: 72px 84px 1fr 120px;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
    }

    .rank {
      font-family: var(--font-display);
      font-size: 2.4rem;
      color: var(--accent-secondary);
      text-align: center;
    }

    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 24px;
      overflow: hidden;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar span {
      color: var(--accent-contrast);
      font-size: 1.7rem;
      font-weight: 800;
    }

    .fighter-main h2 {
      margin-bottom: 6px;
      font-size: 1.15rem;
    }

    .fighter-main p {
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    .meta-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .meta-tags span {
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      font-size: 0.8rem;
    }

    .fighter-side {
      text-align: right;
    }

    .fighter-side strong {
      display: block;
      font-family: var(--font-display);
      font-size: 2.1rem;
      line-height: 1;
      color: var(--accent-secondary);
    }

    .fighter-side small {
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .alert {
      margin-bottom: 18px;
      padding: 12px 14px;
      border-radius: 12px;
    }

    .alert-error {
      background: var(--danger-soft);
      border: 1px solid var(--danger-border);
      color: var(--danger-text);
    }

    .loading-state,
    .empty-state {
      text-align: center;
      padding: 60px 24px;
      color: var(--text-muted);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      margin: 0 auto 12px;
      animation: spin .8s linear infinite;
    }

    .empty-icon {
      display: block;
      margin-bottom: 12px;
      font-size: 2rem;
      color: var(--accent);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 1100px) {
      .filters-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 860px) {
      .rating-card {
        grid-template-columns: 64px 64px 1fr;
      }

      .fighter-side {
        grid-column: 1 / -1;
        text-align: left;
      }
    }

    @media (max-width: 720px) {
      .page-wrap {
        padding: 24px 16px 40px;
      }

      .filters-grid,
      .rating-card {
        grid-template-columns: 1fr;
      }

      .rank,
      .fighter-side {
        text-align: left;
      }
    }
  `],
})
export class RatingComponent implements OnInit {
  martialArts: MartialArt[] = [];
  fighters: FighterProfile[] = [];
  isLoading = true;
  errorMessage = '';

  filters: LeaderboardFilters = {
    martial_art_id: null,
    experience_level: null,
    weight_category: null,
    min_duration: null,
    max_duration: null,
    limit: 20,
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getMartialArts().subscribe({
      next: (arts) => (this.martialArts = arts),
      error: () => undefined,
    });
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    this.isLoading = true;
    this.errorMessage = '';

    this.api.getLeaderboard(this.filters).subscribe({
      next: (response) => {
        this.fighters = response.results;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.fighters = [];
        const firstError = Object.values(err?.error || {}).flat()?.[0];
        this.errorMessage = typeof firstError === 'string' ? firstError : 'Не удалось загрузить рейтинг.';
      },
    });
  }

  resetFilters() {
    this.filters = {
      martial_art_id: null,
      experience_level: null,
      weight_category: null,
      min_duration: null,
      max_duration: null,
      limit: 20,
    };
    this.loadLeaderboard();
  }
}

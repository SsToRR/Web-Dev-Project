import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiService, FighterProfile } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-page">
      <section class="hero">
        <div class="hero-copy">
          <span class="eyebrow">FightTrack</span>
          <h1>Вызовы, подтверждения, рейтинг и история спаррингов в одном месте.</h1>
          <p>
            Боец сначала отправляет вызов, соперник принимает или отклоняет его,
            после тренировки результат попадает в историю и влияет на рейтинг.
          </p>

          <div class="hero-actions">
            @if (auth.hasToken()) {
              <a class="accent-btn" routerLink="/matchmaking">Найти соперника</a>
              <a class="ghost-btn ghost-btn--link" routerLink="/fights">Мои вызовы</a>
            } @else {
              <a class="accent-btn" routerLink="/register">Зарегистрировать бойца</a>
              <a class="ghost-btn ghost-btn--link" routerLink="/login">Войти</a>
            }
          </div>
        </div>

        <div class="hero-panel">
          <div class="metric-card">
            <strong>{{ leaders.length }}</strong>
            <span>Лидеров в витрине</span>
          </div>
          <div class="metric-card">
            <strong>4</strong>
            <span>Весовые категории</span>
          </div>
          <div class="metric-card">
            <strong>100%</strong>
            <span>Контроль статуса вызова</span>
          </div>
        </div>
      </section>

      <section class="feature-grid">
        <article class="feature-card">
          <span class="feature-index">01</span>
          <h2>Вызов с подтверждением</h2>
          <p>Спарринг не начинается автоматически: сперва отправка, затем ответ соперника.</p>
        </article>
        <article class="feature-card">
          <span class="feature-index">02</span>
          <h2>Фильтры по весу и уровню</h2>
          <p>Матчмейкинг учитывает весовую категорию, рейтинг, город и опыт бойца.</p>
        </article>
        <article class="feature-card">
          <span class="feature-index">03</span>
          <h2>Рейтинг лидеров</h2>
          <p>Отдельная страница показывает сильнейших по рейтингу с фильтрами по типу и длительности.</p>
        </article>
      </section>

      <section class="leaders-section">
        <div class="section-head">
          <div>
            <span class="eyebrow">Топ бойцов</span>
            <h2>Лидеры текущего рейтинга</h2>
          </div>
          <a class="ghost-btn ghost-btn--link" routerLink="/rating">Открыть весь рейтинг</a>
        </div>

        @if (isLoading) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Загружаем лидеров...</p>
          </div>
        } @else {
          <div class="leaders-grid">
            @for (fighter of leaders; track fighter.id; let idx = $index) {
              <article class="leader-card">
                <div class="leader-rank">#{{ idx + 1 }}</div>
                <div class="leader-avatar">
                  @if (fighter.avatar_url) {
                    <img [src]="fighter.avatar_url" [alt]="fighter.username" />
                  } @else {
                    <span>{{ fighter.username[0].toUpperCase() }}</span>
                  }
                </div>
                <h3>{{ fighter.username }}</h3>
                <p>{{ fighter.experience_label }} · {{ fighter.city || 'Город не указан' }}</p>
                <div class="leader-tags">
                  <span>Рейтинг {{ fighter.rating }}</span>
                  @if (fighter.weight_category_label) {
                    <span>{{ fighter.weight_category_label }}</span>
                  }
                </div>
              </article>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .home-page {
      max-width: 1240px;
      margin: 0 auto;
      padding: 32px 24px 56px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.25fr 0.8fr;
      gap: 22px;
      margin-bottom: 24px;
    }

    .hero-copy,
    .hero-panel,
    .feature-card,
    .leader-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }

    .hero-copy {
      padding: 34px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.04), transparent 34%),
        var(--surface);
    }

    .eyebrow {
      display: inline-flex;
      margin-bottom: 12px;
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
      font-size: clamp(2.5rem, 5vw, 4.8rem);
      line-height: 0.95;
      letter-spacing: 1px;
      margin-bottom: 16px;
    }

    .hero-copy p {
      max-width: 720px;
      color: var(--text-muted);
      font-size: 1.02rem;
      margin-bottom: 24px;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .hero-panel {
      padding: 24px;
      display: grid;
      gap: 14px;
      align-content: center;
    }

    .metric-card {
      padding: 18px 20px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
    }

    .metric-card strong {
      display: block;
      font-family: var(--font-display);
      font-size: 2.2rem;
      line-height: 1;
      color: var(--accent-secondary);
    }

    .metric-card span {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 18px;
      margin-bottom: 24px;
    }

    .feature-card {
      padding: 24px;
    }

    .feature-index {
      display: inline-block;
      margin-bottom: 14px;
      color: var(--accent-secondary);
      font-family: var(--font-display);
      font-size: 1.7rem;
    }

    .feature-card h2 {
      margin-bottom: 8px;
      font-size: 1.1rem;
    }

    .feature-card p {
      color: var(--text-muted);
    }

    .leaders-section {
      margin-top: 28px;
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .section-head h2 {
      font-size: 1.5rem;
    }

    .leaders-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    .leader-card {
      padding: 22px;
      text-align: center;
    }

    .leader-rank {
      color: var(--accent-secondary);
      font-family: var(--font-display);
      font-size: 1.6rem;
      margin-bottom: 14px;
    }

    .leader-avatar {
      width: 72px;
      height: 72px;
      margin: 0 auto 14px;
      border-radius: 24px;
      overflow: hidden;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .leader-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .leader-avatar span {
      color: var(--accent-contrast);
      font-size: 1.7rem;
      font-weight: 800;
    }

    .leader-card h3 {
      margin-bottom: 6px;
      font-size: 1.05rem;
    }

    .leader-card p {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 12px;
    }

    .leader-tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .leader-tags span {
      padding: 7px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border);
      font-size: 0.78rem;
    }

    .loading-state {
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

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 1024px) {
      .hero,
      .feature-grid,
      .leaders-grid {
        grid-template-columns: 1fr 1fr;
      }

      .hero-copy {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 720px) {
      .home-page {
        padding: 24px 16px 40px;
      }

      .hero,
      .feature-grid,
      .leaders-grid {
        grid-template-columns: 1fr;
      }

      .section-head {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  leaders: FighterProfile[] = [];
  isLoading = true;

  constructor(public auth: AuthService, private api: ApiService) {}

  ngOnInit() {
    this.api.getLeaderboard({ limit: 4 }).subscribe({
      next: (response) => {
        this.leaders = response.results;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }
}

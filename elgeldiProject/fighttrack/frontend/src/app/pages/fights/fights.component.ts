import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, FightRecord } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

interface SparringFinishForm {
  fightId: number | null;
  opponentReview: string;
  skillRating: number;
}

@Component({
  selector: 'app-fights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <div>
          <h1 class="page-title">Мои вызовы и спарринги</h1>
          <p class="page-subtitle">Входящие вызовы, принятые спарринги и архив завершённых тренировок.</p>
        </div>

        @if (myProfile) {
          <div class="stats-bar">
            <div class="stat">
              <span class="stat-value accent">{{ myProfile.rating }}</span>
              <span class="stat-label">Рейтинг</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ myProfile.total_fights }}</span>
              <span class="stat-label">Принятые вызовы</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ myProfile.weight_category_label || '—' }}</span>
              <span class="stat-label">Весовая категория</span>
            </div>
          </div>
        }
      </div>

      @if (notification) {
        <div class="alert" [class.alert-success]="notification.type === 'success'" [class.alert-error]="notification.type === 'error'">
          {{ notification.message }}
        </div>
      }

      @if (isLoading) {
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <p>Загружаем список вызовов...</p>
        </div>
      } @else {
        <section class="section-block">
          <div class="section-head">
            <h2>Входящие вызовы</h2>
            <span>{{ incomingChallenges.length }}</span>
          </div>

          @if (incomingChallenges.length) {
            <div class="fight-list">
              @for (fight of incomingChallenges; track fight.id) {
                <article class="fight-card">
                  <div class="fight-main">
                    <div class="fight-header">
                      <div>
                        <strong>{{ fight.initiator_username }}</strong>
                        <span class="vs-label">вызывает вас</span>
                      </div>
                      <span class="status-badge status-badge--pending">{{ fight.challenge_status_label }}</span>
                    </div>

                    <div class="fight-meta">
                      <span>{{ fight.date | date:'dd.MM.yyyy HH:mm' }}</span>
                      <span>{{ fight.duration_minutes }} мин</span>
                      @if (fight.martial_art_detail) {
                        <span>{{ fight.martial_art_detail.name }}</span>
                      }
                      @if (fight.location_detail) {
                        <span>{{ fight.location_detail.name }}</span>
                      }
                    </div>
                  </div>

                  <div class="fight-actions">
                    <button class="btn-accept" (click)="respondToChallenge(fight, 'accept')">Принять</button>
                    <button class="btn-decline" (click)="respondToChallenge(fight, 'decline')">Отклонить</button>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">Нет входящих вызовов.</div>
          }
        </section>

        <section class="section-block">
          <div class="section-head">
            <h2>Исходящие вызовы</h2>
            <span>{{ outgoingChallenges.length }}</span>
          </div>

          @if (outgoingChallenges.length) {
            <div class="fight-list">
              @for (fight of outgoingChallenges; track fight.id) {
                <article class="fight-card">
                  <div class="fight-main">
                    <div class="fight-header">
                      <div>
                        <strong>{{ fight.opponent_username }}</strong>
                        <span class="vs-label">ожидает ответа</span>
                      </div>
                      <span class="status-badge status-badge--pending">{{ fight.challenge_status_label }}</span>
                    </div>
                    <div class="fight-meta">
                      <span>{{ fight.date | date:'dd.MM.yyyy HH:mm' }}</span>
                      <span>{{ fight.duration_minutes }} мин</span>
                      @if (fight.martial_art_detail) {
                        <span>{{ fight.martial_art_detail.name }}</span>
                      }
                    </div>
                  </div>

                  <div class="fight-actions">
                    <button class="btn-delete" (click)="deleteFight(fight)">Отменить вызов</button>
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">Нет вызовов, ожидающих ответа.</div>
          }
        </section>

        <section class="section-block">
          <div class="section-head">
            <h2>Принятые спарринги</h2>
            <span>{{ acceptedChallenges.length }}</span>
          </div>

          @if (acceptedChallenges.length) {
            <div class="fight-list">
              @for (fight of acceptedChallenges; track fight.id) {
                <article class="fight-card fight-card--accepted">
                  <div class="fight-main">
                    <div class="fight-header">
                      <div>
                        <strong>{{ getOpponentName(fight) }}</strong>
                        <span class="vs-label">принял вызов</span>
                      </div>
                      <span class="status-badge status-badge--accepted">{{ fight.challenge_status_label }}</span>
                    </div>

                    <div class="fight-meta">
                      <span>{{ fight.date | date:'dd.MM.yyyy HH:mm' }}</span>
                      <span>{{ fight.duration_minutes }} мин</span>
                      @if (fight.martial_art_detail) {
                        <span>{{ fight.martial_art_detail.name }}</span>
                      }
                      @if (fight.location_detail) {
                        <span>{{ fight.location_detail.name }}</span>
                      }
                    </div>

                    @if (isFutureFight(fight)) {
                      <p class="fight-note">Спарринг запланирован. Завершение станет доступно после наступления времени.</p>
                    }
                  </div>

                  <div class="fight-actions">
                    @if (canFinish(fight)) {
                      <button class="btn-review" (click)="openReviewForm(fight)">Завершить спарринг</button>
                    }
                    @if (isInitiator(fight)) {
                      <button class="btn-delete" (click)="deleteFight(fight)">Удалить</button>
                    }
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">Пока нет принятых спаррингов.</div>
          }
        </section>

        <section class="section-block">
          <div class="section-head">
            <h2>Архив</h2>
            <span>{{ archivedFights.length }}</span>
          </div>

          @if (archivedFights.length) {
            <div class="fight-list">
              @for (fight of archivedFights; track fight.id) {
                <article class="fight-card" [class.fight-card--finished]="fight.is_finished">
                  <div class="fight-main">
                    <div class="fight-header">
                      <div>
                        <strong>{{ getOpponentName(fight) }}</strong>
                        <span class="vs-label">
                          {{ fight.is_finished ? 'спарринг завершён' : 'вызов завершён без подтверждения' }}
                        </span>
                      </div>
                      <span class="status-badge" [class.status-badge--declined]="fight.challenge_status === 'declined'" [class.status-badge--finished]="fight.is_finished">
                        {{ fight.is_finished ? 'Завершён' : fight.challenge_status_label }}
                      </span>
                    </div>

                    <div class="fight-meta">
                      <span>{{ fight.date | date:'dd.MM.yyyy HH:mm' }}</span>
                      <span>{{ fight.duration_minutes }} мин</span>
                      @if (fight.martial_art_detail) {
                        <span>{{ fight.martial_art_detail.name }}</span>
                      }
                    </div>

                    @if (fight.opponent_review) {
                      <div class="review-block">
                        <span class="review-label">Отзыв</span>
                        <p class="review-text">{{ fight.opponent_review }}</p>
                        @if (fight.opponent_skill_rating) {
                          <div class="skill-stars">{{ getStars(fight.opponent_skill_rating) }} · {{ fight.opponent_skill_rating }}/10</div>
                        }
                      </div>
                    }
                  </div>
                </article>
              }
            </div>
          } @else {
            <div class="empty-state">Архив пока пуст.</div>
          }
        </section>
      }

      @if (reviewForm.fightId !== null) {
        <div class="modal-overlay" (click)="closeReviewForm()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Завершение спарринга</h2>

            <div class="form-group">
              <label>Отзыв об оппоненте</label>
              <textarea
                [(ngModel)]="reviewForm.opponentReview"
                name="reviewText"
                rows="4"
                placeholder="Что можете сказать о сопернике, технике и спарринге?"
              ></textarea>
            </div>

            <div class="form-group">
              <label>Оценка навыков: {{ reviewForm.skillRating }}/10</label>
              <input type="range" min="1" max="10" [(ngModel)]="reviewForm.skillRating" name="skillRating" />
              <div class="rating-stars">{{ getStars(reviewForm.skillRating) }}</div>
            </div>

            @if (reviewError) {
              <div class="alert alert-error">{{ reviewError }}</div>
            }

            <div class="modal-actions">
              <button class="btn-primary" (click)="submitReview()" [disabled]="isSaving">
                @if (isSaving) {
                  <span class="spinner"></span> Сохраняем...
                } @else {
                  Сохранить
                }
              </button>
              <button class="btn-ghost" (click)="closeReviewForm()">Отмена</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px; max-width: 1100px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 28px; flex-wrap: wrap; }
    .page-title { font-family: var(--font-display); font-size: 2.4rem; letter-spacing: 2px; }
    .page-subtitle { color: var(--text-muted); margin-top: 8px; max-width: 720px; }
    .stats-bar { display: flex; gap: 18px; flex-wrap: wrap; }
    .stat { min-width: 120px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; text-align: center; box-shadow: var(--shadow); }
    .stat-value { display: block; font-family: var(--font-display); font-size: 1.6rem; }
    .stat-value.accent { color: var(--accent); }
    .stat-label { color: var(--text-muted); font-size: .78rem; text-transform: uppercase; letter-spacing: 1px; }
    .section-block { margin-bottom: 24px; }
    .section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
    .section-head h2 { font-size: 1.2rem; }
    .section-head span { color: var(--accent); font-weight: 700; }
    .fight-list { display: grid; gap: 14px; }
    .fight-card {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 20px;
      border-radius: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      align-items: flex-start;
    }
    .fight-card--accepted { border-color: var(--success-border); }
    .fight-card--finished { border-left: 4px solid var(--accent); }
    .fight-main { flex: 1; }
    .fight-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
    .fight-header strong { font-size: 1.05rem; }
    .vs-label { margin-left: 8px; color: var(--text-muted); font-size: .9rem; }
    .fight-meta { display: flex; gap: 10px; flex-wrap: wrap; color: var(--text-muted); font-size: .88rem; margin-bottom: 10px; }
    .fight-meta span { padding: 6px 10px; border-radius: 999px; background: rgba(255, 255, 255, .08); border: 1px solid var(--border); }
    .fight-note { color: var(--text-muted); font-size: .88rem; }
    .status-badge {
      padding: 7px 10px;
      border-radius: 999px;
      font-size: .78rem;
      border: 1px solid var(--border);
      background: rgba(255,255,255,.08);
      white-space: nowrap;
    }
    .status-badge--pending { color: var(--accent-secondary); border-color: var(--border-strong); }
    .status-badge--accepted,
    .status-badge--finished { color: var(--success-text); border-color: var(--success-border); }
    .status-badge--declined { color: var(--danger-text); border-color: var(--danger-border); }
    .fight-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-accept, .btn-decline, .btn-delete, .btn-review, .btn-primary, .btn-ghost {
      padding: 10px 14px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-weight: 700;
      transition: all .2s ease;
    }
    .btn-accept, .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--accent-contrast); }
    .btn-accept:hover, .btn-primary:hover:not(:disabled), .btn-review:hover { transform: translateY(-2px); }
    .btn-decline, .btn-delete {
      background: var(--danger-soft);
      color: var(--danger-text);
      border: 1px solid var(--danger-border);
    }
    .btn-review {
      background: var(--success-soft);
      color: var(--success-text);
      border: 1px solid var(--success-border);
    }
    .btn-ghost {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    .review-block { margin-top: 10px; padding: 14px; border-radius: 14px; background: rgba(255,255,255,.08); border: 1px solid var(--border); }
    .review-label { display: block; margin-bottom: 6px; color: var(--text-muted); font-size: .78rem; text-transform: uppercase; letter-spacing: 1px; }
    .review-text { margin-bottom: 6px; }
    .skill-stars { color: var(--accent-secondary); font-size: .88rem; }
    .alert { padding: 12px 14px; border-radius: 12px; margin-bottom: 18px; }
    .alert-error { background: var(--danger-soft); border: 1px solid var(--danger-border); color: var(--danger-text); }
    .alert-success { background: var(--success-soft); border: 1px solid var(--success-border); color: var(--success-text); }
    .loading-state, .empty-state { text-align: center; padding: 32px; color: var(--text-muted); background: rgba(255,255,255,.02); border-radius: 16px; border: 1px dashed var(--border); }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; margin: 0 auto 12px; animation: spin .8s linear infinite; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.75);
      display: flex; align-items: center; justify-content: center; z-index: 100;
      backdrop-filter: blur(4px);
    }
    .modal {
      width: 480px; max-width: 95vw;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
    }
    .modal h2 { margin-bottom: 16px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: .8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .form-group textarea, .form-group input[type="range"] { width: 100%; }
    .form-group textarea {
      padding: 12px 14px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      resize: vertical;
      min-height: 110px;
    }
    .rating-stars { margin-top: 8px; color: var(--accent-secondary); }
    .modal-actions { display: flex; gap: 12px; margin-top: 20px; }
    .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255, 243, 243, .32); border-top-color: var(--accent-contrast); border-radius: 50%; animation: spin .7s linear infinite; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 860px) {
      .fight-card { flex-direction: column; }
      .fight-header { flex-direction: column; align-items: flex-start; }
    }
    @media (max-width: 720px) {
      .page-wrap { padding: 24px 16px 40px; }
      .modal-actions { flex-direction: column; }
      .stats-bar { width: 100%; }
      .stat { flex: 1 1 100%; }
    }
  `],
})
export class FightsComponent implements OnInit {
  fights: FightRecord[] = [];
  myProfile: any = null;
  isLoading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  reviewForm: SparringFinishForm = {
    fightId: null,
    opponentReview: '',
    skillRating: 7,
  };
  reviewError = '';
  isSaving = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  get incomingChallenges() {
    return this.fights.filter((fight) => this.isOpponent(fight) && fight.challenge_status === 'pending');
  }

  get outgoingChallenges() {
    return this.fights.filter((fight) => this.isInitiator(fight) && fight.challenge_status === 'pending');
  }

  get acceptedChallenges() {
    return this.fights.filter((fight) => fight.challenge_status === 'accepted' && !fight.is_finished);
  }

  get archivedFights() {
    return this.fights.filter((fight) => fight.is_finished || fight.challenge_status === 'declined');
  }

  ngOnInit() {
    this.myProfile = this.auth.getUser();
    this.refreshData();
  }

  refreshData() {
    this.isLoading = true;
    this.auth.refreshProfile().subscribe({
      next: (profile) => (this.myProfile = profile),
      error: () => undefined,
    });

    this.api.getFights().subscribe({
      next: (fights) => {
        this.fights = fights;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  isInitiator(fight: FightRecord) {
    return fight.initiator === this.myProfile?.user_id || fight.initiator_username === this.myProfile?.username;
  }

  isOpponent(fight: FightRecord) {
    return fight.opponent === this.myProfile?.user_id || fight.opponent_username === this.myProfile?.username;
  }

  getOpponentName(fight: FightRecord) {
    return this.isInitiator(fight) ? fight.opponent_username : fight.initiator_username;
  }

  canFinish(fight: FightRecord) {
    return fight.challenge_status === 'accepted' && !fight.is_finished && new Date(fight.date) <= new Date();
  }

  isFutureFight(fight: FightRecord) {
    return new Date(fight.date) > new Date();
  }

  respondToChallenge(fight: FightRecord, action: 'accept' | 'decline') {
    this.api.respondToChallenge(fight.id, action).subscribe({
      next: (response) => {
        this.showNotification(response.message, 'success');
        this.refreshData();
      },
      error: (err) => {
        this.showNotification(err?.error?.detail || 'Не удалось ответить на вызов.', 'error');
      },
    });
  }

  openReviewForm(fight: FightRecord) {
    this.reviewForm = {
      fightId: fight.id,
      opponentReview: '',
      skillRating: 7,
    };
    this.reviewError = '';
  }

  closeReviewForm() {
    this.reviewForm.fightId = null;
  }

  submitReview() {
    if (!this.reviewForm.opponentReview.trim()) {
      this.reviewError = 'Напишите отзыв об оппоненте.';
      return;
    }

    this.isSaving = true;
    this.reviewError = '';

    this.api.finishSparring(this.reviewForm.fightId!, this.reviewForm.opponentReview, this.reviewForm.skillRating).subscribe({
      next: (response) => {
        this.isSaving = false;
        this.closeReviewForm();
        this.showNotification(response.message, 'success');
        this.refreshData();
      },
      error: (err) => {
        this.isSaving = false;
        this.reviewError = err?.error?.detail || 'Не удалось завершить спарринг.';
      },
    });
  }

  deleteFight(fight: FightRecord) {
    const name = this.getOpponentName(fight);
    if (!confirm(`Удалить вызов с ${name}?`)) {
      return;
    }

    this.api.deleteFight(fight.id).subscribe({
      next: () => {
        this.showNotification('Запись удалена.', 'success');
        this.refreshData();
      },
      error: () => {
        this.showNotification('Ошибка при удалении записи.', 'error');
      },
    });
  }

  getStars(rating: number) {
    const full = Math.round(rating / 2);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => (this.notification = null), 4000);
  }
}

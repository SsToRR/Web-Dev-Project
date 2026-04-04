import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ApiService,
  FighterProfile,
  Location,
  MartialArt,
  MatchmakingFilters,
} from '../../services/api.service';

@Component({
  selector: 'app-matchmaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-header">
        <h1 class="page-title">Подбор соперника</h1>
        <p class="page-subtitle">Найдите бойца по весовой категории, рейтингу и опыту, затем отправьте вызов.</p>
      </div>

      <div class="filter-card">
        <h2 class="section-title">Параметры поиска</h2>
        <div class="filter-grid">
          <div class="form-group">
            <label>Вид спорта</label>
            <select [(ngModel)]="filters.martial_art_id" name="martial_art">
              <option [ngValue]="null">Любой</option>
              @for (art of martialArts; track art.id) {
                <option [ngValue]="art.id">{{ art.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Локация</label>
            <select [(ngModel)]="filters.location_id" name="location">
              <option [ngValue]="null">Любая</option>
              @for (loc of locations; track loc.id) {
                <option [ngValue]="loc.id">{{ loc.name }}</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Уровень</label>
            <select [(ngModel)]="filters.experience_level" name="experience_level">
              <option [ngValue]="null">Любой</option>
              <option [ngValue]="1">Новичок</option>
              <option [ngValue]="2">Любитель</option>
              <option [ngValue]="3">Средний</option>
              <option [ngValue]="4">Продвинутый</option>
              <option [ngValue]="5">Профессионал</option>
            </select>
          </div>

          <div class="form-group">
            <label>Весовая категория</label>
            <select [(ngModel)]="filters.weight_category" name="weight_category">
              <option [ngValue]="null">Любая</option>
              <option value="light">Легкая</option>
              <option value="middle">Средняя</option>
              <option value="heavy">Тяжелая</option>
              <option value="super_heavy">Супертяжелая</option>
            </select>
          </div>

          <div class="form-group">
            <label>Разброс рейтинга (±{{ filters.rating_range }})</label>
            <input type="range" min="50" max="500" step="50" [(ngModel)]="filters.rating_range" name="rating_range" />
          </div>
        </div>

        <div class="filter-actions">
          <button class="btn-primary" (click)="applyFilters()" [disabled]="isSearching">
            @if (isSearching) {
              <span class="spinner"></span> Ищем...
            } @else {
              Применить фильтры
            }
          </button>
          <button class="btn-secondary" (click)="autoMatch()" [disabled]="isSearching">Автоподбор</button>
        </div>
      </div>

      @if (errorMessage) {
        <div class="alert alert-error">{{ errorMessage }}</div>
      }

      @if (opponents.length > 0) {
        <div class="results-header">
          <h2 class="section-title">Найдено соперников: {{ totalFound }}</h2>
        </div>

        <div class="opponents-grid">
          @for (fighter of opponents; track fighter.id) {
            <article class="fighter-card">
              <div class="fighter-avatar">
                @if (fighter.avatar_url) {
                  <img [src]="fighter.avatar_url" [alt]="fighter.username" />
                } @else {
                  <span>{{ fighter.username[0].toUpperCase() }}</span>
                }
              </div>

              <div class="fighter-info">
                <h3 class="fighter-name">{{ fighter.username }}</h3>
                <div class="fighter-meta">
                  <span class="badge badge-rating">Рейтинг {{ fighter.rating }}</span>
                  <span class="badge badge-exp">{{ fighter.experience_label }}</span>
                  @if (fighter.weight_category_label) {
                    <span class="badge badge-weight">{{ fighter.weight_category_label }}</span>
                  }
                </div>
                <div class="fighter-stats">
                  @if (fighter.weight_kg) {
                    <span>{{ fighter.weight_kg }} кг</span>
                  }
                  @if (fighter.height_cm) {
                    <span>{{ fighter.height_cm }} см</span>
                  }
                  @if (fighter.city) {
                    <span>{{ fighter.city }}</span>
                  }
                </div>
                @if (fighter.achievements) {
                  <p class="fighter-achievements">{{ fighter.achievements }}</p>
                }
              </div>

              <button class="btn-challenge" (click)="challengeFighter(fighter)">Бросить вызов</button>
            </article>
          }
        </div>
      }

      @if (searched && opponents.length === 0 && !errorMessage) {
        <div class="empty-state">
          <span class="empty-icon">/</span>
          <p>Соперники не найдены. Попробуйте ослабить фильтры.</p>
        </div>
      }

      @if (challengeTarget) {
        <div class="modal-overlay" (click)="closeChallenge()">
          <div class="modal" (click)="$event.stopPropagation()">
            <h2>Вызов на спарринг</h2>
            <p class="modal-subtitle">Соперник: <strong>{{ challengeTarget.username }}</strong></p>

            <div class="form-group">
              <label>Вид спорта</label>
              <select [(ngModel)]="challengeForm.martial_art_rule" name="challenge_martial_art">
                <option [ngValue]="null">Выберите</option>
                @for (art of martialArts; track art.id) {
                  <option [ngValue]="art.id">{{ art.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Локация</label>
              <select [(ngModel)]="challengeForm.location" name="challenge_location">
                <option [ngValue]="null">Выберите</option>
                @for (loc of locations; track loc.id) {
                  <option [ngValue]="loc.id">{{ loc.name }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Дата и время</label>
              <input type="datetime-local" [(ngModel)]="challengeForm.date" name="challenge_date" />
            </div>

            <div class="form-group">
              <label>Длительность тренировки, мин</label>
              <input type="number" min="15" max="300" step="15" [(ngModel)]="challengeForm.duration_minutes" name="challenge_duration" />
            </div>

            @if (challengeError) {
              <div class="alert alert-error">{{ challengeError }}</div>
            }

            <div class="modal-actions">
              <button class="btn-primary" (click)="sendChallenge()" [disabled]="isSending">
                @if (isSending) {
                  <span class="spinner"></span> Отправляем...
                } @else {
                  Отправить вызов
                }
              </button>
              <button class="btn-ghost" (click)="closeChallenge()">Отмена</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-wrap { padding: 32px; max-width: 1120px; margin: 0 auto; }
    .page-header { margin-bottom: 32px; }
    .page-title { font-family: var(--font-display); font-size: 2.4rem; letter-spacing: 2px; }
    .page-subtitle { color: var(--text-muted); margin-top: 8px; }
    .section-title { font-size: 1.15rem; margin-bottom: 18px; }
    .filter-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 22px;
      box-shadow: var(--shadow);
    }
    .filter-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
    .form-group { display: flex; flex-direction: column; gap: 8px; }
    .form-group label { font-size: .78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .form-group select, .form-group input {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text);
    }
    .form-group input[type="range"] { padding: 0; accent-color: var(--accent); }
    .filter-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn-primary, .btn-secondary, .btn-ghost, .btn-challenge {
      padding: 11px 18px;
      border-radius: 12px;
      border: none;
      font-weight: 700;
      cursor: pointer;
      transition: all .2s ease;
    }
    .btn-primary { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--accent-contrast); }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 22px rgba(255, 0, 0, .24); }
    .btn-secondary { background: transparent; color: var(--accent-secondary); border: 1px solid var(--border-strong); }
    .btn-secondary:hover:not(:disabled) { background: var(--accent-soft); }
    .btn-ghost { background: transparent; color: var(--text-muted); border: 1px solid var(--border); }
    .btn-challenge { background: transparent; color: var(--accent-secondary); border: 1px solid var(--border-strong); }
    .btn-challenge:hover { background: linear-gradient(135deg, var(--accent), var(--accent-secondary)); color: var(--accent-contrast); }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: .6; cursor: not-allowed; }
    .alert { padding: 12px 14px; border-radius: 12px; margin-bottom: 18px; }
    .alert-error { background: var(--danger-soft); border: 1px solid var(--danger-border); color: var(--danger-text); }
    .results-header { margin-bottom: 14px; }
    .opponents-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
    .fighter-card {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      box-shadow: var(--shadow);
    }
    .fighter-avatar {
      width: 58px; height: 58px; border-radius: 18px; overflow: hidden;
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .fighter-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .fighter-avatar span { color: var(--accent-contrast); font-weight: 800; font-size: 1.5rem; }
    .fighter-info { flex: 1; }
    .fighter-name { margin-bottom: 8px; font-size: 1.15rem; }
    .fighter-meta, .fighter-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
    .badge {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: .78rem;
      border: 1px solid var(--border);
      background: rgba(255,255,255,.08);
    }
    .badge-rating { color: var(--accent-secondary); }
    .badge-exp { color: var(--accent); }
    .badge-weight { color: var(--text); }
    .fighter-stats span { color: var(--text-muted); font-size: .85rem; }
    .fighter-achievements { color: var(--text-muted); font-size: .88rem; }
    .empty-state { text-align: center; padding: 60px; color: var(--text-muted); }
    .empty-icon { font-size: 2rem; display: block; margin-bottom: 12px; color: var(--accent); }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.72);
      display: flex; align-items: center; justify-content: center; z-index: 100;
      backdrop-filter: blur(4px);
    }
    .modal {
      width: 460px; max-width: 95vw;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 28px;
    }
    .modal h2 { margin-bottom: 8px; }
    .modal-subtitle { color: var(--text-muted); margin-bottom: 18px; }
    .modal-actions { display: flex; gap: 12px; margin-top: 24px; }
    .spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid rgba(255, 243, 243, .32); border-top-color: var(--accent-contrast); border-radius: 50%; animation: spin .7s linear infinite; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1100px) {
      .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 720px) {
      .page-wrap { padding: 24px 16px 40px; }
      .filter-grid { grid-template-columns: 1fr; }
      .fighter-card { flex-direction: column; }
      .btn-challenge { width: 100%; }
      .modal-actions { flex-direction: column; }
    }
  `],
})
export class MatchmakingComponent implements OnInit {
  filters: MatchmakingFilters = {
    martial_art_id: null,
    location_id: null,
    experience_level: null,
    weight_category: null,
    rating_range: 200,
    auto: false,
  };

  opponents: FighterProfile[] = [];
  locations: Location[] = [];
  martialArts: MartialArt[] = [];
  totalFound = 0;
  isSearching = false;
  searched = false;
  errorMessage = '';

  challengeTarget: FighterProfile | null = null;
  challengeForm = {
    martial_art_rule: null as number | null,
    location: null as number | null,
    date: '',
    duration_minutes: 60,
  };
  challengeError = '';
  isSending = false;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getLocations().subscribe((locations) => (this.locations = locations));
    this.api.getMartialArts().subscribe((arts) => (this.martialArts = arts));
  }

  applyFilters() {
    this.errorMessage = '';
    this.isSearching = true;
    this.searched = false;

    this.api.findOpponent({ ...this.filters, auto: false }).subscribe({
      next: (response) => {
        this.opponents = response.results;
        this.totalFound = response.count;
        this.isSearching = false;
        this.searched = true;
      },
      error: (err) => {
        this.isSearching = false;
        this.searched = true;
        this.opponents = [];
        this.errorMessage = err?.error?.detail || 'Соперники не найдены.';
      },
    });
  }

  autoMatch() {
    this.errorMessage = '';
    this.isSearching = true;
    this.searched = false;

    this.api.findOpponent({ auto: true, rating_range: this.filters.rating_range }).subscribe({
      next: (response) => {
        this.opponents = response.results;
        this.totalFound = response.count;
        this.isSearching = false;
        this.searched = true;
      },
      error: (err) => {
        this.isSearching = false;
        this.searched = true;
        this.opponents = [];
        this.errorMessage = err?.error?.detail || 'Соперники не найдены.';
      },
    });
  }

  challengeFighter(fighter: FighterProfile) {
    this.challengeTarget = fighter;
    this.challengeError = '';
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0, 0, 0);
    this.challengeForm = {
      martial_art_rule: null,
      location: null,
      date: this.formatDateTimeLocal(nextHour),
      duration_minutes: 60,
    };
  }

  closeChallenge() {
    this.challengeTarget = null;
  }

  sendChallenge() {
    if (!this.challengeTarget) {
      return;
    }

    if (!this.challengeForm.date) {
      this.challengeError = 'Выберите дату и время.';
      return;
    }

    if (!this.challengeForm.martial_art_rule) {
      this.challengeError = 'Нужно выбрать вид спорта.';
      return;
    }

    if (!this.challengeForm.location) {
      this.challengeError = 'Нужно выбрать зал.';
      return;
    }

    const challengeDate = new Date(this.challengeForm.date);
    if (Number.isNaN(challengeDate.getTime()) || challengeDate <= new Date()) {
      this.challengeError = 'Нельзя бросить вызов в прошлом времени.';
      return;
    }

    if (this.challengeForm.duration_minutes < 15 || this.challengeForm.duration_minutes > 300) {
      this.challengeError = 'Укажите длительность от 15 до 300 минут.';
      return;
    }

    this.isSending = true;
    this.challengeError = '';

    this.api.createFight({
      opponent: this.challengeTarget.user_id,
      date: challengeDate.toISOString(),
      duration_minutes: this.challengeForm.duration_minutes,
      is_sparring: true,
      martial_art_rule: this.challengeForm.martial_art_rule,
      location: this.challengeForm.location,
    }).subscribe({
      next: () => {
        this.isSending = false;
        this.closeChallenge();
        this.router.navigate(['/fights']);
      },
      error: (err) => {
        this.isSending = false;
        this.challengeError = err?.error?.detail || JSON.stringify(err?.error) || 'Не удалось отправить вызов.';
      },
    });
  }

  private formatDateTimeLocal(date: Date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  }
}

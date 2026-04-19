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
  templateUrl: './matchmaking.component.html',
  styleUrl: './matchmaking.component.css',
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

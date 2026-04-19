import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, FighterProfile, LeaderboardFilters, MartialArt } from '../../services/api.service';

@Component({
  selector: 'app-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating.component.html',
  styleUrl: './rating.component.css',
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

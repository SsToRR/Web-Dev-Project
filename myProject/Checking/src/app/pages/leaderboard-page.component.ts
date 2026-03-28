import { Component, OnInit, inject, signal } from '@angular/core';

import { LeaderboardEntry } from '../models/api.models';
import { FightTrackApiService } from '../services/fight-track-api.service';

@Component({
  selector: 'app-leaderboard-page',
  templateUrl: './leaderboard-page.component.html',
  styleUrl: './shared-page.css'
})
export class LeaderboardPageComponent implements OnInit {
  private readonly api = inject(FightTrackApiService);

  protected readonly entries = signal<LeaderboardEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal('');

  ngOnInit(): void {
    this.api.getLeaderboard().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Could not load leaderboard.');
      }
    });
  }
}

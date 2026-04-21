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
  templateUrl: './fights.component.html',
  styleUrl: './fights.component.css',
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

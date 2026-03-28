import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../services/auth.service';
import {
  ChallengeRecord,
  CreateChallengePayload,
  CreateReviewPayload,
  FighterCard,
  FighterProfileSummary,
  LocationOption,
  ReviewSummary,
  ReviewTarget,
  RuleOption
} from '../models/api.models';
import { FightTrackApiService } from '../services/fight-track-api.service';

@Component({
  selector: 'app-fights-page',
  imports: [FormsModule, DatePipe],
  templateUrl: './fights-page.component.html',
  styleUrl: './shared-page.css'
})
export class FightsPageComponent implements OnInit {
  private readonly api = inject(FightTrackApiService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly submittingReview = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly challenges = signal<ChallengeRecord[]>([]);
  protected readonly fighters = signal<FighterCard[]>([]);
  protected readonly locations = signal<LocationOption[]>([]);
  protected readonly rules = signal<RuleOption[]>([]);
  protected readonly reviewTargets = signal<ReviewTarget[]>([]);
  protected readonly receivedReviews = signal<ReviewSummary[]>([]);
  protected readonly profile = signal<FighterProfileSummary | null>(null);
  protected readonly currentUser = this.auth.currentUser;

  protected readonly challengeForm = signal<CreateChallengePayload>({
    opponent_id: null,
    location_id: null,
    martial_art_rule_id: null,
    date: new Date().toISOString().slice(0, 10),
    message: '',
    is_sparring: true
  });

  protected readonly reviewForm = signal<CreateReviewPayload>({
    target_id: null,
    rating: 5,
    comment: ''
  });

  protected readonly incomingChallenges = computed(() =>
    this.challenges().filter(
      (challenge) =>
        challenge.status === 'pending' && challenge.opponent_id === this.currentUser()?.id
    )
  );

  protected readonly outgoingChallenges = computed(() =>
    this.challenges().filter(
      (challenge) =>
        challenge.status === 'pending' && challenge.initiator_id === this.currentUser()?.id
    )
  );

  protected readonly acceptedChallenges = computed(() =>
    this.challenges().filter((challenge) => challenge.status === 'accepted')
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected createChallenge(): void {
    const payload = this.challengeForm();

    if (!payload.opponent_id || !payload.location_id || !payload.martial_art_rule_id || !payload.date) {
      this.errorMessage.set('Pick a fighter, location, martial art and date before sending a challenge.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.saving.set(true);

    this.api.createChallenge(payload).subscribe({
      next: () => {
        this.successMessage.set('Challenge sent. Waiting for the opponent response.');
        this.saving.set(false);
        this.resetChallengeForm();
        this.loadDashboard();
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Could not send the challenge.');
      }
    });
  }

  protected acceptChallenge(id: number): void {
    this.updateChallengeStatus(id, 'accepted', 'Challenge accepted.');
  }

  protected declineChallenge(id: number): void {
    this.updateChallengeStatus(id, 'declined', 'Challenge declined.');
  }

  protected cancelChallenge(id: number): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.api.deleteChallenge(id).subscribe({
      next: () => {
        this.successMessage.set('Challenge deleted.');
        this.loadDashboard();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.detail ?? 'Delete request failed.');
      }
    });
  }

  protected chooseFighter(fighter: FighterCard): void {
    this.challengeForm.update((current) => ({
      ...current,
      opponent_id: fighter.id
    }));
    this.successMessage.set(`Challenge form prepared for ${fighter.username}.`);
  }

  protected submitReview(): void {
    const payload = this.reviewForm();

    if (!payload.target_id || !payload.rating) {
      this.errorMessage.set('Choose a fighter and a rating before submitting a review.');
      return;
    }

    this.errorMessage.set('');
    this.successMessage.set('');
    this.submittingReview.set(true);

    this.api.createReview(payload).subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.successMessage.set('Review saved. The trust score was recalculated.');
        this.reviewForm.set({
          target_id: this.reviewTargets()[0]?.id ?? null,
          rating: 5,
          comment: ''
        });
        this.loadDashboard();
      },
      error: (error) => {
        this.submittingReview.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Review could not be submitted.');
      }
    });
  }

  protected updateChallengeField<K extends keyof CreateChallengePayload>(
    field: K,
    value: CreateChallengePayload[K]
  ): void {
    this.challengeForm.update((current) => ({
      ...current,
      [field]: value
    }));
  }

  protected updateReviewField<K extends keyof CreateReviewPayload>(
    field: K,
    value: CreateReviewPayload[K]
  ): void {
    this.reviewForm.update((current) => ({
      ...current,
      [field]: value
    }));
  }

  private updateChallengeStatus(id: number, status: ChallengeRecord['status'], message: string): void {
    this.errorMessage.set('');
    this.successMessage.set('');

    this.api.updateChallengeStatus(id, status).subscribe({
      next: () => {
        this.successMessage.set(message);
        this.loadDashboard();
      },
      error: (error) => {
        this.errorMessage.set(error.error?.detail ?? 'Challenge update failed.');
      }
    });
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.api.getChallengeDashboard().subscribe({
      next: (response) => {
        this.profile.set(response.profile);
        this.challenges.set(response.challenges);
        this.fighters.set(response.fighters);
        this.locations.set(response.locations);
        this.rules.set(response.rules);
        this.reviewTargets.set(response.review_targets);
        this.receivedReviews.set(response.received_reviews);
        this.loading.set(false);

        this.challengeForm.update((current) => ({
          ...current,
          opponent_id: current.opponent_id ?? response.fighters[0]?.id ?? null,
          location_id: current.location_id ?? response.locations[0]?.id ?? null,
          martial_art_rule_id: current.martial_art_rule_id ?? response.rules[0]?.id ?? null
        }));

        this.reviewForm.update((current) => ({
          ...current,
          target_id: current.target_id ?? response.review_targets[0]?.id ?? null
        }));
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Could not load the challenge board.');
      }
    });
  }

  private resetChallengeForm(): void {
    this.challengeForm.set({
      opponent_id: this.fighters()[0]?.id ?? null,
      location_id: this.locations()[0]?.id ?? null,
      martial_art_rule_id: this.rules()[0]?.id ?? null,
      date: new Date().toISOString().slice(0, 10),
      message: '',
      is_sparring: true
    });
  }
}

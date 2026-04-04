import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AuthResponse,
  ChallengeDashboardResponse,
  ChallengeRecord,
  CreateChallengePayload,
  CreateReviewPayload,
  LeaderboardEntry,
  LoginPayload,
  RegisterPayload,
  ReviewSummary
} from '../models/api.models';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

@Injectable({
  providedIn: 'root'
})
export class FightTrackApiService {
  private readonly http = inject(HttpClient);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login/`, payload);
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/register/`, payload);
  }

  logout(refreshToken: string | null): Observable<{ detail: string }> {
    return this.http.post<{ detail: string }>(`${API_BASE_URL}/auth/logout/`, {
      refresh_token: refreshToken
    });
  }

  getChallengeDashboard(): Observable<ChallengeDashboardResponse> {
    return this.http.get<ChallengeDashboardResponse>(`${API_BASE_URL}/fights/`);
  }

  createChallenge(payload: CreateChallengePayload): Observable<ChallengeRecord> {
    return this.http.post<ChallengeRecord>(`${API_BASE_URL}/fights/`, payload);
  }

  updateChallengeStatus(
    challengeId: number,
    status: ChallengeRecord['status']
  ): Observable<ChallengeRecord> {
    return this.http.patch<ChallengeRecord>(`${API_BASE_URL}/fights/${challengeId}/`, { status });
  }

  deleteChallenge(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/fights/${id}/`);
  }

  createReview(payload: CreateReviewPayload): Observable<ReviewSummary> {
    return this.http.post<ReviewSummary>(`${API_BASE_URL}/reviews/`, payload);
  }

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${API_BASE_URL}/leaderboard/`);
  }
}

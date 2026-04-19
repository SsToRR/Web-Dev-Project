import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthResponse {
  access: string;
  refresh: string;
  user: FighterProfile;
}

export interface AiCoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCoachResponse {
  reply: string;
}

export interface FighterProfile {
  id: number;
  user_id: number;
  username: string;
  email: string;
  rating: number;
  experience_level: number;
  experience_label: string;
  achievements: string;
  weight_kg: number | null;
  height_cm: number | null;
  weight_category: string | null;
  weight_category_label: string | null;
  city: string;
  avatar_url: string;
  total_fights: number;
}

export interface FightRecord {
  id: number;
  initiator: number;
  initiator_username: string;
  opponent: number;
  opponent_username: string;
  winner: number | null;
  winner_username: string | null;
  location: number | null;
  location_detail: { id: number; name: string; address: string } | null;
  martial_art_rule: number | null;
  martial_art_detail: { id: number; name: string; number_of_rounds: number; round_duration_minutes: number } | null;
  date: string;
  duration_minutes: number;
  is_sparring: boolean;
  challenge_status: 'pending' | 'accepted' | 'declined';
  challenge_status_label: string;
  is_finished: boolean;
  opponent_review: string;
  opponent_skill_rating: number | null;
  rating_delta: number;
  created_at: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
}

export interface MartialArt {
  id: number;
  name: string;
  number_of_rounds: number;
  round_duration_minutes: number;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  password_confirm: string;
  experience_level: number;
  achievements?: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  city?: string;
  avatar_url?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  experience_level?: number;
  achievements?: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  city?: string;
  avatar_url?: string;
}

export interface MatchmakingFilters {
  martial_art_id?: number | null;
  location_id?: number | null;
  experience_level?: number | null;
  weight_category?: string | null;
  rating_range?: number;
  auto?: boolean;
}

export interface CreateChallengeRequest {
  opponent: number;
  date: string;
  duration_minutes: number;
  is_sparring: boolean;
  martial_art_rule?: number | null;
  location?: number | null;
}

export interface LeaderboardFilters {
  martial_art_id?: number | null;
  experience_level?: number | null;
  weight_category?: string | null;
  min_duration?: number | null;
  max_duration?: number | null;
  limit?: number;
}

export interface PaginatedFighters {
  count: number;
  results: FighterProfile[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:8000/api/v1';

  constructor(private http: HttpClient) {}

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register/`, data);
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login/`, { username, password });
  }

  askAiCoach(message: string, history: AiCoachMessage[]): Observable<AiCoachResponse> {
    return this.http.post<AiCoachResponse>(`${this.base}/ai-coach/chat/`, { message, history });
  }

  logout(refresh: string): Observable<any> {
    return this.http.post(`${this.base}/auth/logout/`, { refresh });
  }

  getMyProfile(): Observable<FighterProfile> {
    return this.http.get<FighterProfile>(`${this.base}/profile/me/`);
  }

  updateMyProfile(data: UpdateProfileRequest): Observable<FighterProfile> {
    return this.http.patch<FighterProfile>(`${this.base}/profile/me/`, data);
  }

  getFights(): Observable<FightRecord[]> {
    return this.http.get<FightRecord[]>(`${this.base}/fights/`);
  }

  createFight(data: CreateChallengeRequest): Observable<FightRecord> {
    return this.http.post<FightRecord>(`${this.base}/fights/`, data);
  }

  respondToChallenge(id: number, action: 'accept' | 'decline'): Observable<{ message: string; fight: FightRecord }> {
    return this.http.post<{ message: string; fight: FightRecord }>(`${this.base}/fights/${id}/respond/`, { action });
  }

  deleteFight(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/fights/${id}/`);
  }

  finishSparring(id: number, review: string, skillRating: number): Observable<{ message: string; fight: FightRecord }> {
    return this.http.post<{ message: string; fight: FightRecord }>(`${this.base}/fights/${id}/finish/`, {
      opponent_review: review,
      opponent_skill_rating: skillRating,
    });
  }

  findOpponent(filters: MatchmakingFilters): Observable<PaginatedFighters> {
    return this.http.post<PaginatedFighters>(`${this.base}/matchmaking/find/`, filters);
  }

  getLeaderboard(filters: LeaderboardFilters = {}): Observable<PaginatedFighters> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedFighters>(`${this.base}/leaderboard/`, { params });
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.base}/locations/`);
  }

  getMartialArts(): Observable<MartialArt[]> {
    return this.http.get<MartialArt[]>(`${this.base}/martial-arts/`);
  }
}

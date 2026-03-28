export interface AuthUser {
  id: number;
  username: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: AuthUser;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterExperiencePayload {
  martial_art_name: string;
  years: number;
  months: number;
}

export interface RegisterPayload {
  username: string;
  password: string;
  confirm_password: string;
  achievements: string;
  experiences: RegisterExperiencePayload[];
}

export interface LocationOption {
  id: number;
  name: string;
  address: string;
}

export interface RuleOption {
  id: number;
  name: string;
  number_of_rounds: number;
  round_duration_minutes: number;
}

export interface ExperienceEntry {
  id: number;
  martial_art_rule_id: number;
  martial_art_name: string;
  years: number;
  months: number;
  label: string;
}

export interface FighterCard {
  id: number;
  username: string;
  achievements: string;
  rating: number;
  total_fights: number;
  total_reviews: number;
  average_review_score: number;
  experiences: ExperienceEntry[];
  can_receive_review: boolean;
}

export interface FighterProfileSummary {
  username: string;
  rating: number;
  total_fights: number;
  total_reviews: number;
  average_review_score: number;
  achievements: string;
  experiences: ExperienceEntry[];
}

export interface ChallengeRecord {
  id: number;
  initiator_id: number;
  initiator_username: string;
  opponent_id: number;
  opponent_username: string;
  location_id: number;
  location_name: string;
  location_address: string;
  martial_art_rule_id: number;
  rule_name: string;
  rule_rounds: number;
  rule_round_duration_minutes: number;
  date: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  is_sparring: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChallengePayload {
  opponent_id: number | null;
  location_id: number | null;
  martial_art_rule_id: number | null;
  date: string;
  message: string;
  is_sparring: boolean;
}

export interface ReviewSummary {
  id: number;
  reviewer_id: number;
  reviewer_username: string;
  target_id: number;
  target_username: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ReviewTarget {
  id: number;
  username: string;
}

export interface CreateReviewPayload {
  target_id: number | null;
  rating: number;
  comment: string;
}

export interface ChallengeDashboardResponse {
  profile: FighterProfileSummary;
  challenges: ChallengeRecord[];
  fighters: FighterCard[];
  locations: LocationOption[];
  rules: RuleOption[];
  review_targets: ReviewTarget[];
  received_reviews: ReviewSummary[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  rating: number;
  total_fights: number;
  total_reviews: number;
  average_review_score: number;
  achievements: string;
  top_experiences: string[];
}

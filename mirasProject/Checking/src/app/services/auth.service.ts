import { Injectable, computed, signal } from '@angular/core';

import { AuthResponse, AuthUser } from '../models/api.models';

const ACCESS_TOKEN_KEY = 'fighttrack_access';
const REFRESH_TOKEN_KEY = 'fighttrack_refresh';
const USER_KEY = 'fighttrack_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly accessTokenState = signal<string | null>(this.readStorage(ACCESS_TOKEN_KEY));
  private readonly refreshTokenState = signal<string | null>(this.readStorage(REFRESH_TOKEN_KEY));
  private readonly currentUserState = signal<AuthUser | null>(this.readUser());

  readonly currentUser = computed(() => this.currentUserState());
  readonly isAuthenticated = computed(() => Boolean(this.accessTokenState()));

  accessToken(): string | null {
    return this.accessTokenState();
  }

  refreshToken(): string | null {
    return this.refreshTokenState();
  }

  setSession(session: AuthResponse): void {
    this.accessTokenState.set(session.access);
    this.refreshTokenState.set(session.refresh);
    this.currentUserState.set(session.user);

    this.writeStorage(ACCESS_TOKEN_KEY, session.access);
    this.writeStorage(REFRESH_TOKEN_KEY, session.refresh);
    this.writeStorage(USER_KEY, JSON.stringify(session.user));
  }

  clearSession(): void {
    this.accessTokenState.set(null);
    this.refreshTokenState.set(null);
    this.currentUserState.set(null);

    this.removeStorage(ACCESS_TOKEN_KEY);
    this.removeStorage(REFRESH_TOKEN_KEY);
    this.removeStorage(USER_KEY);
  }

  private readStorage(key: string): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(key);
  }

  private readUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.localStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  }

  private removeStorage(key: string): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }
}

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService, FighterProfile, RegisterRequest } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private _user$ = new BehaviorSubject<FighterProfile | null>(this.readUser());

  isLoggedIn$ = this._isLoggedIn$.asObservable();
  user$ = this._user$.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUser(): FighterProfile | null {
    return this._user$.value;
  }

  login(username: string, password: string) {
    return this.api.login(username, password).pipe(
      tap((res) => this.persistSession(res.access, res.refresh, res.user))
    );
  }

  register(payload: RegisterRequest) {
    return this.api.register(payload).pipe(
      tap((res) => this.persistSession(res.access, res.refresh, res.user))
    );
  }

  refreshProfile() {
    return this.api.getMyProfile().pipe(
      tap((profile) => this.setUser(profile))
    );
  }

  updateUser(profile: FighterProfile) {
    this.setUser(profile);
  }

  logout() {
    const refresh = localStorage.getItem('refresh_token') || '';
    this.api.logout(refresh).subscribe({ error: () => undefined });
    localStorage.clear();
    this._user$.next(null);
    this._isLoggedIn$.next(false);
    this.router.navigate(['/']);
  }

  private persistSession(access: string, refresh: string, user: FighterProfile) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    this.setUser(user);
    this._isLoggedIn$.next(true);
  }

  private setUser(user: FighterProfile) {
    localStorage.setItem('user', JSON.stringify(user));
    this._user$.next(user);
  }

  private readUser(): FighterProfile | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }
}

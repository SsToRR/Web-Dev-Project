import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';
import { FightTrackApiService } from './services/fight-track-api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly api = inject(FightTrackApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentUser = this.auth.currentUser;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly logoutError = signal('');

  protected logout(): void {
    this.logoutError.set('');

    this.api.logout(this.auth.refreshToken()).subscribe({
      next: () => {
        this.auth.clearSession();
        void this.router.navigateByUrl('/login');
      },
      error: () => {
        this.auth.clearSession();
        this.logoutError.set('Session cleanup finished locally, but the server logout request failed.');
        void this.router.navigateByUrl('/login');
      }
    });
  }
}

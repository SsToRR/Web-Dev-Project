import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { RegisterExperiencePayload } from '../models/api.models';
import { AuthService } from '../services/auth.service';
import { FightTrackApiService } from '../services/fight-track-api.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './shared-page.css'
})
export class LoginPageComponent {
  private readonly api = inject(FightTrackApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly username = signal('fighter_one');
  protected readonly password = signal('FightTrack123!');
  protected readonly confirmPassword = signal('');
  protected readonly achievements = signal('');
  protected readonly experiences = signal<RegisterExperiencePayload[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isSubmitting = signal(false);
  protected readonly martialArts = [
    'Boxing',
    'MMA',
    'Kickboxing',
    'Hand-to-hand combat',
    'Muay Thai',
    'Wrestling',
    'Jiu-Jitsu'
  ];

  constructor() {
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl('/fights');
    }
  }

  protected login(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.api.login({
      username: this.username().trim(),
      password: this.password()
    }).subscribe({
      next: (session) => {
        this.auth.setSession(session);
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/fights');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Login failed. Check the backend server and credentials.');
      }
    });
  }

  protected register(): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    this.api.register({
      username: this.username().trim(),
      password: this.password(),
      confirm_password: this.confirmPassword(),
      achievements: this.achievements().trim(),
      experiences: this.experiences().filter((experience) => experience.martial_art_name.trim().length > 0)
    }).subscribe({
      next: (session) => {
        this.auth.setSession(session);
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/fights');
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Registration failed. Try another username.');
      }
    });
  }

  protected setMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.errorMessage.set('');

    if (mode === 'login') {
      this.username.set('fighter_one');
      this.password.set('FightTrack123!');
      this.confirmPassword.set('');
      this.achievements.set('');
      this.experiences.set([]);
      return;
    }

    this.username.set('');
    this.password.set('');
    this.confirmPassword.set('');
    this.achievements.set('');
    this.experiences.set([{ martial_art_name: 'Boxing', years: 0, months: 0 }]);
  }

  protected addExperience(): void {
    this.experiences.update((current) => [
      ...current,
      { martial_art_name: '', years: 0, months: 0 }
    ]);
  }

  protected removeExperience(index: number): void {
    this.experiences.update((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  protected updateExperience<K extends keyof RegisterExperiencePayload>(
    index: number,
    field: K,
    value: RegisterExperiencePayload[K]
  ): void {
    this.experiences.update((current) =>
      current.map((experience, currentIndex) =>
        currentIndex === index
          ? {
              ...experience,
              [field]: value
            }
          : experience
      )
    );
  }
}

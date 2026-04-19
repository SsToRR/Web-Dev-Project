import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ApiService, FighterProfile, UpdateProfileRequest } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  profile: FighterProfile | null = null;
  isLoading = true;
  isSaving = false;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  form: UpdateProfileRequest = {
    username: '',
    email: '',
    city: '',
    weight_kg: null,
    height_cm: null,
    experience_level: 1,
    achievements: '',
  };

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.auth.updateUser(profile);
        this.form = {
          username: profile.username,
          email: profile.email,
          city: profile.city,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          experience_level: profile.experience_level,
          achievements: profile.achievements,
        };
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.showNotification('Не удалось загрузить профиль.', 'error');
      },
    });
  }

  saveProfile() {
    this.isSaving = true;
    this.notification = null;

    this.api.updateMyProfile(this.form).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.auth.updateUser(profile);
        this.isSaving = false;
        this.showNotification('Профиль обновлён.', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        const firstError = Object.values(err?.error || {}).flat()?.[0];
        this.showNotification(typeof firstError === 'string' ? firstError : 'Не удалось сохранить профиль.', 'error');
      },
    });
  }

  private showNotification(message: string, type: 'success' | 'error') {
    this.notification = { message, type };
    setTimeout(() => (this.notification = null), 4000);
  }
}

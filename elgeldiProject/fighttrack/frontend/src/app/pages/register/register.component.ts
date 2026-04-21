import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  form = {
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    experience_level: 1,
    achievements: '',
    weight_kg: null as number | null,
    height_cm: null as number | null,
    city: '',
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.form.username || !this.form.password || !this.form.password_confirm) {
      this.errorMessage = 'Заполните логин и пароль.';
      return;
    }

    if (this.form.password !== this.form.password_confirm) {
      this.errorMessage = 'Пароли не совпадают.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.register(this.form).subscribe({
      next: () => {
        this.successMessage = 'Профиль создан. Перенаправляем в систему.';
        setTimeout(() => this.router.navigate(['/fights']), 500);
      },
      error: (err) => {
        this.isLoading = false;
        const firstError = Object.values(err?.error || {}).flat()?.[0];
        this.errorMessage = typeof firstError === 'string' ? firstError : 'Не удалось зарегистрировать бойца.';
      },
    });
  }
}

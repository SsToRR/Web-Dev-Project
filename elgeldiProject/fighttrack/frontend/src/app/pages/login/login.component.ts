import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  username = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Заполните все поля.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        this.successMessage = 'Добро пожаловать.';
        setTimeout(() => this.router.navigate(['/fights']), 500);
      },
      error: (err) => {
        this.isLoading = false;
        const detail = err?.error?.non_field_errors?.[0]
          || err?.error?.detail
          || 'Неверный логин или пароль.';
        this.errorMessage = detail;
      },
    });
  }
}

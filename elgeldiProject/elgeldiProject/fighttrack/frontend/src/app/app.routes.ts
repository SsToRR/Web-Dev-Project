import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

import { AuthService } from './services/auth.service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

const guestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasToken()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'rating',
    loadComponent: () => import('./pages/rating/rating.component').then((m) => m.RatingComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'matchmaking',
    loadComponent: () =>
      import('./pages/matchmaking/matchmaking.component').then((m) => m.MatchmakingComponent),
    canActivate: [authGuard],
  },
  {
    path: 'fights',
    loadComponent: () => import('./pages/fights/fights.component').then((m) => m.FightsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];

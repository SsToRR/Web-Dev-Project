import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { FightsPageComponent } from './pages/fights-page.component';
import { LeaderboardPageComponent } from './pages/leaderboard-page.component';
import { LoginPageComponent } from './pages/login-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'fights'
  },
  {
    path: 'login',
    component: LoginPageComponent
  },
  {
    path: 'fights',
    component: FightsPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'leaderboard',
    component: LeaderboardPageComponent
  },
  {
    path: '**',
    redirectTo: 'fights'
  }
];

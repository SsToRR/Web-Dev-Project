// src/app/interceptors/jwt.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();
    const isPublicEndpoint =
      req.url.includes('/auth/login/') ||
      req.url.includes('/auth/register/') ||
      req.url.includes('/auth/refresh/') ||
      req.url.includes('/leaderboard/') ||
      req.url.includes('/martial-arts/');

    // Keep public pages readable even if localStorage still has an expired token.
    if (token && !isPublicEndpoint) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isPublicEndpoint) {
          this.auth.logout();
        }
        return throwError(() => err);
      })
    );
  }
}

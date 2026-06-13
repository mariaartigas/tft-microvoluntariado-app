import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators'; //esto del map que es?

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  /*return authService.user$.pipe(
    map(user => {
      if (user) {
        return true;
      }

      return router.createUrlTree(['/login']);
    })
  );*/
  return authService.isAuthenticated()
    ? true
    : router.parseUrl('/login');

};

export const guestGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated()
    ? router.parseUrl('/dashboard')
    : true;
};
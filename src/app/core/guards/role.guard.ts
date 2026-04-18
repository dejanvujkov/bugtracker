import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

export function roleGuard(roles: UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    if (auth.hasRole(roles)) return true;
    inject(Router).navigate(['/']);
    return false;
  };
}

import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import * as bcrypt from 'bcryptjs';
import { REPOS } from '../../database/repository-factory';
import { User, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private repos = inject(REPOS);
  private router = inject(Router);

  private _currentUser = signal<User | null>(
    (() => {
      try {
        const stored = sessionStorage.getItem('currentUser');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    })()
  );

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isSuperuser = computed(() => this._currentUser()?.role === 'superuser');
  readonly isAdmin = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'superuser' || role === 'project_admin';
  });

  hasRole(roles: UserRole[]): boolean {
    const role = this._currentUser()?.role;
    return role ? roles.includes(role) : false;
  }

  async login(email: string, password: string): Promise<void> {
    const user = await this.repos.users.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');
    if (!user.isActive) throw new Error('Account is deactivated');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new Error('Invalid email or password');

    // Strip password before storing in session
    const safeUser = { ...user, password: '' };
    sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
    this._currentUser.set(safeUser);
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshCurrentUser(): void {
    const stored = sessionStorage.getItem('currentUser');
    if (stored) {
      this._currentUser.set(JSON.parse(stored));
    }
  }
}

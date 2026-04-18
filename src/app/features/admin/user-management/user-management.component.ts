import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDialogModule, MatSnackBarModule, MatTooltipModule, MatSlideToggleModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">User Management</h1>
        <p class="page-subtitle">Manage all users in the system</p>
      </div>
    </div>

    <div class="content-split">
      <!-- User List -->
      <div class="content-card">
        <table mat-table [dataSource]="users()" class="users-table">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <app-avatar [user]="u" [size]="36"></app-avatar>
                <div>
                  <div class="user-name">{{ u.fullName }}</div>
                  <div class="user-email">{{ u.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let u">
              <mat-select [value]="u.role" (selectionChange)="changeRole(u, $event.value)" [disabled]="u.role === 'superuser'" style="width:150px">
                <mat-option value="member">Member</mat-option>
                <mat-option value="project_admin">Project Admin</mat-option>
                <mat-option value="superuser">Superuser</mat-option>
              </mat-select>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Active</th>
            <td mat-cell *matCellDef="let u">
              <mat-slide-toggle [checked]="u.isActive" (change)="toggleActive(u, $event.checked)" [disabled]="u.role === 'superuser'">
              </mat-slide-toggle>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;" [class.inactive-row]="!row.isActive"></tr>
        </table>
      </div>

      <!-- Create User -->
      <div class="create-card">
        <h2>Create New User</h2>
        <div class="create-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Full Name</mat-label>
            <input matInput [(ngModel)]="newName">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="newEmail">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="newPassword">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Role</mat-label>
            <mat-select [(ngModel)]="newRole">
              <mat-option value="member">Member</mat-option>
              <mat-option value="project_admin">Project Admin</mat-option>
            </mat-select>
          </mat-form-field>
          @if (createError()) {
            <div class="error-msg">{{ createError() }}</div>
          }
          <button mat-flat-button color="primary" class="full-width" (click)="createUser()">Create User</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { padding: 32px 32px 16px; }
    .page-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; }
    .page-subtitle { margin: 0; color: #605e5c; font-size: 14px; }
    .content-split { display: flex; gap: 24px; padding: 0 32px 32px; align-items: flex-start; }
    .content-card { flex: 1; background: white; border-radius: 8px; box-shadow: var(--shadow-card); overflow: hidden; }
    .create-card { width: 320px; background: white; border-radius: 8px; box-shadow: var(--shadow-card); padding: 24px; flex-shrink: 0; }
    .create-card h2 { margin: 0 0 20px; font-size: 16px; font-weight: 600; }
    .create-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .users-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-name { font-weight: 600; font-size: 14px; }
    .user-email { font-size: 12px; color: #605e5c; }
    .inactive-row { opacity: 0.5; }
    .error-msg { color: #d83b01; font-size: 13px; }
  `]
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  users = signal<User[]>([]);
  columns = ['user', 'role', 'status'];

  newName = '';
  newEmail = '';
  newPassword = '';
  newRole: UserRole = 'member';
  createError = signal('');

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.users.set(await this.userService.getAll());
  }

  async changeRole(user: User, role: UserRole): Promise<void> {
    await this.userService.update(user.id, { role });
    this.snackBar.open('Role updated', 'OK', { duration: 2000 });
    await this.load();
  }

  async toggleActive(user: User, active: boolean): Promise<void> {
    if (active) {
      await this.userService.reactivate(user.id);
    } else {
      await this.userService.deactivate(user.id);
    }
    this.snackBar.open(`User ${active ? 'activated' : 'deactivated'}`, 'OK', { duration: 2000 });
    await this.load();
  }

  async createUser(): Promise<void> {
    this.createError.set('');
    if (!this.newName || !this.newEmail || !this.newPassword) {
      this.createError.set('All fields are required');
      return;
    }
    try {
      await this.userService.create({ fullName: this.newName, email: this.newEmail, password: this.newPassword, role: this.newRole });
      this.newName = this.newEmail = this.newPassword = '';
      this.newRole = 'member';
      this.snackBar.open('User created', 'OK', { duration: 2000 });
      await this.load();
    } catch (e: any) {
      this.createError.set(e.message || 'Failed to create user');
    }
  }
}

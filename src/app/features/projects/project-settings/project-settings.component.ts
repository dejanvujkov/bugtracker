import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, ProjectMember, User, ProjectRole } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule, MatTooltipModule, MatChipsModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <a [routerLink]="['/projects', projectId]" class="back-link">
          <mat-icon>arrow_back</mat-icon> Back to Board
        </a>
        <h1 class="page-title">Project Settings</h1>
        <p class="page-subtitle">{{ project()?.name }}</p>
      </div>
    </div>

    <div class="settings-content">
      <!-- Project Details -->
      <div class="settings-card">
        <h2>Details</h2>
        <mat-form-field appearance="outline" class="full-width" floatLabel="always">
          <mat-label>Project Name</mat-label>
          <input matInput [(ngModel)]="projectName">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width" floatLabel="always">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="projectDesc" rows="3"></textarea>
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="saveProject()">Save Changes</button>
      </div>

      <!-- Members -->
      <div class="settings-card">
        <div class="card-header">
          <h2>Members</h2>
        </div>

        <!-- Add member -->
        <div class="add-member-row">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Add user</mat-label>
            <mat-select [(ngModel)]="selectedUserId">
              <mat-option value="">— Select user —</mat-option>
              @for (u of availableUsers(); track u.id) {
                <mat-option [value]="u.id">{{ u.fullName }} ({{ u.email }})</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:160px">
            <mat-label>Role</mat-label>
            <mat-select [(ngModel)]="selectedRole">
              <mat-option value="member">Member</mat-option>
              <mat-option value="project_admin">Admin</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" [disabled]="!selectedUserId" (click)="addMember()">Add</button>
        </div>

        <table mat-table [dataSource]="members()" class="members-table">
          <ng-container matColumnDef="user">
            <th mat-header-cell *matHeaderCellDef>User</th>
            <td mat-cell *matCellDef="let m">
              <div class="user-cell">
                <app-avatar [user]="m.user" [size]="32"></app-avatar>
                <div>
                  <div class="user-name">{{ m.user?.fullName }}</div>
                  <div class="user-email">{{ m.user?.email }}</div>
                </div>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let m">
              <mat-select [value]="m.role" (selectionChange)="changeRole(m, $event.value)" style="width:140px">
                <mat-option value="member">Member</mat-option>
                <mat-option value="project_admin">Admin</mat-option>
              </mat-select>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let m">
              <button mat-icon-button color="warn" matTooltip="Remove from project" (click)="removeMember(m)">
                <mat-icon>person_remove</mat-icon>
              </button>
              @if (auth.isSuperuser() || (auth.isAdmin() && m.user?.role === 'member')) {
                <button mat-icon-button color="warn" matTooltip="Delete user account" (click)="deleteUser(m)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="memberColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: memberColumns;"></tr>
        </table>
      </div>

      <!-- Create User (project admin) -->
      @if (auth.isAdmin()) {
        <div class="settings-card">
          <h2>Create New User</h2>
          <div class="create-user-form">
            <mat-form-field appearance="outline" class="full-width" floatLabel="always">
              <mat-label>Full Name</mat-label>
              <input matInput [(ngModel)]="newUserName">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width" floatLabel="always">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="newUserEmail">
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width" floatLabel="always">
              <mat-label>Password</mat-label>
              <input matInput type="password" [(ngModel)]="newUserPassword">
            </mat-form-field>
            @if (createUserError()) {
              <div class="error-msg">{{ createUserError() }}</div>
            }
            <button mat-flat-button color="primary" (click)="createUser()">Create & Add to Project</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header { padding: 32px 32px 16px; }
    .back-link { display: flex; align-items: center; gap: 4px; color: var(--color-primary); text-decoration: none; font-size: 14px; margin-bottom: 12px; }
    .page-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; }
    .page-subtitle { margin: 0; color: #605e5c; font-size: 14px; }
    .settings-content { padding: 0 32px 32px; display: flex; flex-direction: column; gap: 24px; }
    .settings-card { background: white; border-radius: 8px; box-shadow: var(--shadow-card); padding: 24px; }
    .settings-card h2 { margin: 0 0 20px; font-size: 16px; font-weight: 600; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .card-header h2 { margin: 0; }
    .full-width { width: 100%; }
    .add-member-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .flex-1 { flex: 1; min-width: 200px; }
    .members-table { width: 100%; }
    .user-cell { display: flex; align-items: center; gap: 10px; }
    .user-name { font-weight: 600; font-size: 14px; }
    .user-email { font-size: 12px; color: #605e5c; }
    .create-user-form { display: flex; flex-direction: column; gap: 4px; }
    .error-msg { color: #d83b01; font-size: 13px; }
  `]
})
export class ProjectSettingsComponent implements OnInit {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  projectId = '';
  project = signal<Project | null>(null);
  members = signal<ProjectMember[]>([]);
  allUsers = signal<User[]>([]);
  availableUsers = signal<User[]>([]);

  projectName = '';
  projectDesc = '';
  selectedUserId = '';
  selectedRole: ProjectRole = 'member';
  memberColumns = ['user', 'role', 'actions'];

  newUserName = '';
  newUserEmail = '';
  newUserPassword = '';
  createUserError = signal('');

  async ngOnInit(): Promise<void> {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    await this.load();
  }

  async load(): Promise<void> {
    const [proj, memberList, allUsers] = await Promise.all([
      this.projectService.getById(this.projectId),
      this.projectService.getMembers(this.projectId),
      this.userService.getAll(),
    ]);
    this.project.set(proj);
    this.members.set(memberList);
    this.allUsers.set(allUsers);
    this.projectName = proj?.name || '';
    this.projectDesc = proj?.description || '';

    const memberIds = new Set(memberList.map(m => m.userId));
    this.availableUsers.set(allUsers.filter(u => !memberIds.has(u.id) && u.role !== 'superuser' && u.isActive));
  }

  async saveProject(): Promise<void> {
    await this.projectService.update(this.projectId, { name: this.projectName, description: this.projectDesc });
    this.snackBar.open('Saved!', 'OK', { duration: 2000 });
    await this.load();
  }

  async addMember(): Promise<void> {
    if (!this.selectedUserId) return;
    await this.projectService.addMember(this.projectId, this.selectedUserId, this.selectedRole);
    this.selectedUserId = '';
    this.snackBar.open('Member added', 'OK', { duration: 2000 });
    await this.load();
  }

  async changeRole(member: ProjectMember, role: ProjectRole): Promise<void> {
    await this.projectService.updateMemberRole(this.projectId, member.userId, role);
    this.snackBar.open('Role updated', 'OK', { duration: 2000 });
  }

  deleteUser(member: ProjectMember): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete User',
        message: `Permanently delete "${member.user?.fullName}"? This action cannot be undone.`,
        confirmLabel: 'Delete',
        danger: true,
      }
    });
    ref.afterClosed().subscribe(async (confirmed: boolean) => {
      if (!confirmed) return;
      const result = await this.userService.deleteUser(member.userId, this.projectId);
      if (result.success) {
        this.snackBar.open('User deleted', 'OK', { duration: 2000 });
        await this.load();
      } else {
        this.snackBar.open(result.error ?? 'Failed to delete user', 'Dismiss', { duration: 4000 });
      }
    });
  }

  removeMember(member: ProjectMember): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Remove Member', message: `Remove ${member.user?.fullName} from this project?`, confirmLabel: 'Remove', danger: true }
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.projectService.removeMember(this.projectId, member.userId);
        this.snackBar.open('Member removed', 'OK', { duration: 2000 });
        await this.load();
      }
    });
  }

  async createUser(): Promise<void> {
    this.createUserError.set('');
    if (!this.newUserName || !this.newUserEmail || !this.newUserPassword) {
      this.createUserError.set('All fields are required');
      return;
    }
    try {
      const user = await this.userService.create({ fullName: this.newUserName, email: this.newUserEmail, password: this.newUserPassword });
      await this.projectService.addMember(this.projectId, user.id, 'member');
      this.newUserName = this.newUserEmail = this.newUserPassword = '';
      this.snackBar.open('User created and added to project', 'OK', { duration: 3000 });
      await this.load();
    } catch (e: any) {
      this.createUserError.set(e.message || 'Failed to create user');
    }
  }
}

import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { ProjectMember, User } from '../../../core/models';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-project-create',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, MatSelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <mat-dialog-content>
      <form #form="ngForm" class="create-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Name</mat-label>
          <input matInput name="name" [(ngModel)]="name" required maxlength="100" placeholder="e.g. Alpha Backend">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description (optional)</mat-label>
          <textarea matInput name="desc" [(ngModel)]="description" rows="3" placeholder="What is this project about?"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Project Admin (optional)</mat-label>
          <mat-select name="adminId" [(ngModel)]="adminId">
            <mat-option value="">— None —</mat-option>
            @for (u of users(); track u.id) {
              <mat-option [value]="u.id">{{ u.fullName }} ({{ u.email }})</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!name || loading()" (click)="create()">
        @if (loading()) { <mat-spinner diameter="16"></mat-spinner> } @else { Create }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .create-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; min-width: 400px; }
    .full-width { width: 100%; }
    .error-msg { color: #d83b01; font-size: 13px; }
  `]
})
export class ProjectCreateComponent {
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<ProjectCreateComponent>);
  private snackBar = inject(MatSnackBar);

  name = '';
  description = '';
  adminId = '';
  loading = signal(false);
  error = signal('');
  users = signal<User[]>([]);

  async ngOnInit(): Promise<void> {
    const all = await this.userService.getAll();
    this.users.set(all.filter(u => u.role !== 'superuser' && u.isActive));
  }

  async create(): Promise<void> {
    if (!this.name.trim()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      const project = await this.projectService.create(this.name.trim(), this.description.trim() || undefined);
      if (this.adminId) {
        await this.projectService.addMember(project.id, this.adminId, 'project_admin');
      }
      this.snackBar.open('Project created!', 'OK', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (e: any) {
      this.error.set(e.message || 'Failed to create project');
    } finally {
      this.loading.set(false);
    }
  }
}

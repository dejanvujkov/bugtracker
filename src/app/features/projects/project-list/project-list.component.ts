import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models';
import { ProjectCreateComponent } from '../project-create/project-create.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, MatChipsModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">All Projects</h1>
        <p class="page-subtitle">Manage all projects across the organization</p>
      </div>
      <button mat-flat-button color="primary" (click)="openCreate()">
        <mat-icon>add</mat-icon> New Project
      </button>
    </div>

    <div class="content-card">
      @if (projects().length === 0) {
        <div class="empty-state">
          <mat-icon>folder_open</mat-icon>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button mat-flat-button color="primary" (click)="openCreate()">Create Project</button>
        </div>
      } @else {
        <table mat-table [dataSource]="projects()" class="projects-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Project</th>
            <td mat-cell *matCellDef="let p">
              <a [routerLink]="['/projects', p.id]" class="project-link">{{ p.name }}</a>
              @if (p.description) {
                <p class="project-desc">{{ p.description }}</p>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let p">{{ p.createdAt | date:'mediumDate' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button matTooltip="Settings" [routerLink]="['/projects', p.id, 'settings']">
                <mat-icon>settings</mat-icon>
              </button>
              <button mat-icon-button matTooltip="Delete" color="warn" (click)="confirmDelete(p)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 32px 32px 16px; }
    .page-title { margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #1b1a19; }
    .page-subtitle { margin: 0; color: #605e5c; font-size: 14px; }
    .content-card { margin: 0 32px 32px; background: white; border-radius: 8px; box-shadow: var(--shadow-card); overflow: hidden; }
    .projects-table { width: 100%; }
    .project-link { color: var(--color-primary); text-decoration: none; font-weight: 600; font-size: 15px; }
    .project-link:hover { text-decoration: underline; }
    .project-desc { margin: 2px 0 0; font-size: 13px; color: #605e5c; }
    .empty-state { text-align: center; padding: 64px 32px; color: #605e5c; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: #c8c6c4; }
    .empty-state h3 { margin: 16px 0 8px; font-size: 18px; color: #323130; }
    .empty-state p { margin: 0 0 24px; }
  `]
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  projects = signal<Project[]>([]);
  columns = ['name', 'created', 'actions'];

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.projects.set(await this.projectService.getAll());
  }

  openCreate(): void {
    const ref = this.dialog.open(ProjectCreateComponent, { width: '90vw', maxWidth: '560px' });
    ref.afterClosed().subscribe(result => {
      if (result) this.load();
    });
  }

  confirmDelete(project: Project): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Project',
        message: `Are you sure you want to delete "${project.name}"? This will also delete all tasks and comments.`,
        confirmLabel: 'Delete',
        danger: true,
      }
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.projectService.delete(project.id);
        this.snackBar.open('Project deleted', 'OK', { duration: 3000 });
        this.load();
      }
    });
  }
}

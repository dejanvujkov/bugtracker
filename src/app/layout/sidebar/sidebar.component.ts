import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ProjectService } from '../../core/services/project.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { Project } from '../../core/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sidebar">
      <div class="sidebar-logo">
        <mat-icon class="logo-icon">bug_report</mat-icon>
        <span class="logo-text">BugTracker</span>
      </div>

      <div class="sidebar-section">
        <span class="section-label">PROJECTS</span>
        @if (auth.isSuperuser()) {
          <a routerLink="/projects" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"
             class="sidebar-link" matTooltip="All Projects">
            <mat-icon>folder_open</mat-icon>
            <span>All Projects</span>
          </a>
        }
        @for (project of projects(); track project.id) {
          <a [routerLink]="['/projects', project.id]" routerLinkActive="active"
             class="sidebar-link project-link" [matTooltip]="project.name">
            <mat-icon>folder</mat-icon>
            <span>{{ project.name }}</span>
          </a>
        }
      </div>

      @if (auth.isSuperuser()) {
        <div class="sidebar-section">
          <span class="section-label">ADMIN</span>
          <a routerLink="/admin/users" routerLinkActive="active" class="sidebar-link">
            <mat-icon>people</mat-icon>
            <span>Users</span>
          </a>
        </div>
      }

      <div class="sidebar-footer">
        <app-avatar [user]="auth.currentUser()" [size]="30"></app-avatar>
        <div class="user-info">
          <span class="user-name">{{ auth.currentUser()?.fullName }}</span>
          <span class="user-role">{{ auth.currentUser()?.role | titlecase }}</span>
        </div>
        <button mat-icon-button matTooltip="Logout" (click)="auth.logout()" class="logout-btn">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: 240px;
      background: var(--color-bg-sidebar);
      color: var(--color-sidebar-text);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 100;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .logo-icon { color: var(--color-primary); font-size: 24px; }
    .logo-text { font-size: 17px; font-weight: 700; color: white; }
    .sidebar-section {
      padding: 16px 0 8px;
      overflow-y: auto;
      flex: 1;
    }
    .section-label {
      display: block;
      padding: 0 16px 6px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--color-sidebar-text-muted);
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      color: var(--color-sidebar-text);
      text-decoration: none;
      font-size: 14px;
      border-left: 3px solid transparent;
      transition: background 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-link:hover { background: rgba(255,255,255,0.07); }
    .sidebar-link.active {
      background: var(--color-sidebar-active-bg);
      border-left-color: var(--color-primary);
      color: white;
    }
    .sidebar-link mat-icon { font-size: 18px; flex-shrink: 0; }
    .sidebar-link span { overflow: hidden; text-overflow: ellipsis; }
    .sidebar-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 12px;
      border-top: 1px solid rgba(255,255,255,0.08);
      background: rgba(0,0,0,0.2);
    }
    .user-info { flex: 1; min-width: 0; }
    .user-name { display: block; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { display: block; font-size: 11px; color: var(--color-sidebar-text-muted); }
    .logout-btn { color: var(--color-sidebar-text-muted); flex-shrink: 0; }
  `]
})
export class SidebarComponent implements OnInit {
  auth = inject(AuthService);
  private projectService = inject(ProjectService);
  projects = signal<Project[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
  }

  async loadProjects(): Promise<void> {
    const list = await this.projectService.getAll();
    this.projects.set(list);
  }
}

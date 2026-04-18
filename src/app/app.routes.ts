import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ShellComponent } from './layout/shell/shell.component';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'projects',
        pathMatch: 'full',
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent),
        canActivate: [roleGuard(['superuser'])],
      },
      {
        path: 'projects/:projectId',
        loadComponent: () =>
          import('./features/board/board/board.component').then(m => m.BoardComponent),
      },
      {
        path: 'projects/:projectId/settings',
        loadComponent: () =>
          import('./features/projects/project-settings/project-settings.component').then(m => m.ProjectSettingsComponent),
        canActivate: [roleGuard(['superuser', 'project_admin'])],
      },
      {
        path: 'projects/:projectId/tasks/:taskId',
        loadComponent: () =>
          import('./features/tasks/task-detail/task-detail.component').then(m => m.TaskDetailComponent),
      },
      {
        path: 'projects/:projectId/epics/:epicId',
        loadComponent: () =>
          import('./features/epics/epic-detail/epic-detail.component').then(m => m.EpicDetailComponent),
      },
      {
        path: 'admin/users',
        loadComponent: () =>
          import('./features/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [roleGuard(['superuser'])],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

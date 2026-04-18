import { Component, OnInit, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { MarkdownViewerComponent } from '../../../shared/components/markdown-viewer/markdown-viewer.component';

@Component({
  selector: 'app-epic-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatTableModule, MatChipsModule, MatProgressBarModule, StatusBadgeComponent, AvatarComponent, MarkdownViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (epic()) {
      <div class="epic-page">
        <div class="page-header">
          <a [routerLink]="['/projects', epic()!.projectId]" class="back-link">
            <mat-icon>arrow_back</mat-icon> Back to Board
          </a>
          <div class="epic-title-row">
            <span class="epic-chip"><mat-icon>auto_awesome</mat-icon> EPIC</span>
            <h1 class="epic-title">{{ epic()!.title }}</h1>
            <app-status-badge [status]="epic()!.status"></app-status-badge>
          </div>

          @if (epic()!.assignee) {
            <div class="assignee-row">
              <app-avatar [user]="epic()!.assignee ?? null" [size]="28"></app-avatar>
              <span>{{ epic()!.assignee!.fullName }}</span>
            </div>
          }
        </div>

        <!-- Progress -->
        <div class="section-card">
          <div class="progress-header">
            <h2>Progress</h2>
            <span class="progress-count">{{ closedCount() }} / {{ childTasks().length }} tasks closed</span>
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="progressPct()"
            [color]="progressPct() === 100 ? 'accent' : 'primary'">
          </mat-progress-bar>
          @if (progressPct() === 100 && childTasks().length > 0) {
            <div class="ready-msg">
              <mat-icon>check_circle</mat-icon> All tasks closed — ready to close this epic!
            </div>
          }
        </div>

        <!-- Description -->
        @if (epic()!.description) {
          <div class="section-card">
            <h2>Description</h2>
            <app-markdown-viewer [content]="epic()!.description!"></app-markdown-viewer>
          </div>
        }

        <!-- Child tasks -->
        <div class="section-card">
          <div class="section-header">
            <h2>Tasks ({{ childTasks().length }})</h2>
            <a mat-button color="primary" [routerLink]="['/projects', epic()!.projectId]"
               [queryParams]="{epicId: epic()!.id}">
              <mat-icon>dashboard</mat-icon> View on Board
            </a>
          </div>

          @if (childTasks().length === 0) {
            <p class="empty-msg">No tasks assigned to this epic yet.</p>
          } @else {
            <table mat-table [dataSource]="childTasks()" class="tasks-table">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Task</th>
                <td mat-cell *matCellDef="let t">
                  <a [routerLink]="['/projects', t.projectId, 'tasks', t.id]" class="task-link">{{ t.title }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let t">
                  <app-status-badge [status]="t.status"></app-status-badge>
                </td>
              </ng-container>
              <ng-container matColumnDef="assignee">
                <th mat-header-cell *matHeaderCellDef>Assignee</th>
                <td mat-cell *matCellDef="let t">
                  @if (t.assignee) {
                    <div class="assignee-cell">
                      <app-avatar [user]="t.assignee" [size]="24"></app-avatar>
                      <span>{{ t.assignee.fullName }}</span>
                    </div>
                  } @else {
                    <span class="unassigned">—</span>
                  }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>
          }
        </div>
      </div>
    } @else {
      <div class="loading">Loading…</div>
    }
  `,
  styles: [`
    .epic-page { padding: 24px 32px; max-width: 900px; }
    .back-link { display: flex; align-items: center; gap: 4px; color: var(--color-primary); text-decoration: none; font-size: 14px; margin-bottom: 16px; }
    .page-header { background: white; border-radius: 8px; box-shadow: var(--shadow-card); padding: 24px; margin-bottom: 20px; }
    .epic-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .epic-chip { display: flex; align-items: center; gap: 4px; background: #f0eaf8; color: var(--color-epic); border-radius: 12px; padding: 2px 10px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .epic-chip mat-icon { font-size: 14px; }
    .epic-title { margin: 0; font-size: 22px; font-weight: 700; flex: 1; }
    .assignee-row { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #605e5c; }
    .section-card { background: white; border-radius: 8px; box-shadow: var(--shadow-card); padding: 24px; margin-bottom: 20px; }
    .section-card h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-header h2 { margin: 0; }
    .progress-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .progress-header h2 { margin: 0; }
    .progress-count { font-size: 14px; color: #605e5c; }
    .ready-msg { display: flex; align-items: center; gap: 6px; color: #107c10; font-size: 13px; margin-top: 12px; font-weight: 600; }
    .tasks-table { width: 100%; }
    .task-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
    .task-link:hover { text-decoration: underline; }
    .assignee-cell { display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .unassigned { color: #a19f9d; }
    .empty-msg { color: #a19f9d; font-style: italic; }
    .loading { padding: 64px; text-align: center; color: #605e5c; }
  `]
})
export class EpicDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);

  epic = signal<Task | null>(null);
  childTasks = signal<Task[]>([]);
  columns = ['title', 'status', 'assignee'];

  closedCount = () => this.childTasks().filter(t => t.status === 'closed').length;
  progressPct = () => {
    const total = this.childTasks().length;
    return total ? Math.round((this.closedCount() / total) * 100) : 0;
  };

  async ngOnInit(): Promise<void> {
    const epicId = this.route.snapshot.paramMap.get('epicId')!;
    const [epic, children] = await Promise.all([
      this.taskService.getById(epicId),
      this.taskService.getChildTasks(epicId),
    ]);
    this.epic.set(epic);
    this.childTasks.set(children);
    this.cdr.markForCheck();
  }
}

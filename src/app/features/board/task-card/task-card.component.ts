import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Task } from '../../../core/models';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatChipsModule, MatTooltipModule, CdkDrag, AvatarComponent, TruncatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="task-card" cdkDrag [cdkDragData]="task" [class.epic-card]="task.isEpic">
      <div class="drag-handle" cdkDragHandle>
        <mat-icon>drag_indicator</mat-icon>
      </div>

      @if (task.isEpic) {
        <div class="epic-badge">
          <mat-icon>auto_awesome</mat-icon> EPIC
          @if (task.childCount! > 0) {
            <span class="epic-progress">({{ task.closedChildCount }}/{{ task.childCount }})</span>
          }
        </div>
      }

      @if (!task.isEpic && task.epic) {
        <div class="parent-epic" [matTooltip]="'Epic: ' + task.epic.title">
          <mat-icon>auto_awesome</mat-icon>
          <span>{{ task.epic.title }}</span>
        </div>
      }

      <a class="task-title" [routerLink]="['/projects', task.projectId, 'tasks', task.id]">
        {{ task.title }}
      </a>

      @if (task.description) {
        <p class="task-desc">{{ task.description | truncate:70 }}</p>
      }

      <div class="task-footer">
        <span class="task-id">#{{ task.id.slice(-4) }}</span>
        <span class="spacer"></span>
        @if (task.assignee) {
          <app-avatar [user]="task.assignee" [size]="24" [matTooltip]="task.assignee.fullName"></app-avatar>
        } @else {
          <mat-icon class="unassigned-icon" matTooltip="Unassigned">person_outline</mat-icon>
        }
      </div>

      <!-- Drag placeholder -->
      <div *cdkDragPlaceholder class="drag-placeholder"></div>
    </div>
  `,
  styles: [`
    .task-card {
      background: white;
      border-radius: 6px;
      padding: 12px 12px 10px;
      box-shadow: var(--shadow-card);
      cursor: grab;
      border-left: 3px solid transparent;
      position: relative;
      transition: box-shadow 0.15s, transform 0.15s;
      margin-bottom: 8px;
    }
    .task-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .task-card.epic-card { border-left-color: var(--color-epic); }
    .task-card.cdk-drag-dragging { box-shadow: 0 8px 24px rgba(0,0,0,0.25); opacity: 0.9; }
    .drag-placeholder { background: #e6f3fb; border: 2px dashed var(--color-primary); border-radius: 6px; min-height: 80px; margin-bottom: 8px; }
    .drag-handle {
      position: absolute; top: 8px; right: 6px;
      color: #c8c6c4; cursor: grab;
      opacity: 0; transition: opacity 0.15s;
    }
    .task-card:hover .drag-handle { opacity: 1; }
    .drag-handle mat-icon { font-size: 18px; }
    .epic-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-epic);
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .epic-badge mat-icon { font-size: 12px; }
    .epic-progress { color: #605e5c; font-weight: 400; }
    .parent-epic {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: var(--color-epic);
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .parent-epic mat-icon { font-size: 12px; }
    .task-title {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #1b1a19;
      text-decoration: none;
      line-height: 1.4;
      margin-bottom: 4px;
    }
    .task-title:hover { color: var(--color-primary); }
    .task-desc { margin: 0 0 8px; font-size: 12px; color: #605e5c; line-height: 1.4; }
    .task-footer { display: flex; align-items: center; gap: 6px; }
    .task-id { font-size: 11px; color: #a19f9d; font-family: monospace; }
    .spacer { flex: 1; }
    .unassigned-icon { font-size: 18px; color: #c8c6c4; }
  `]
})
export class TaskCardComponent {
  @Input() task!: Task;
}

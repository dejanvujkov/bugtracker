import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Task, TaskStatus } from '../../../core/models';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'app-board-column',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, CdkDropList, TaskCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="column">
      <div class="column-header" [class]="'column-header--' + status">
        <div class="column-title">
          <span class="status-dot"></span>
          {{ label }}
          <span class="count">{{ tasks.length }}</span>
        </div>
        @if (status === 'open') {
          <button mat-icon-button class="add-btn" (click)="addTask.emit()" title="Add task">
            <mat-icon>add</mat-icon>
          </button>
        }
      </div>

      <div class="column-body"
           cdkDropList
           [id]="listId"
           [cdkDropListData]="status"
           [cdkDropListConnectedTo]="connectedLists"
           (cdkDropListDropped)="dropped.emit($event)">
        @for (task of tasks; track task.id) {
          <app-task-card [task]="task"></app-task-card>
        }
        @if (tasks.length === 0) {
          <div class="empty-column">Drop tasks here</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .column {
      flex: 1;
      min-width: 280px;
      max-width: 360px;
      display: flex;
      flex-direction: column;
      background: #f6f8fa;
      border-radius: 8px;
      overflow: hidden;
    }
    .column-header {
      padding: 0 14px;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid transparent;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .column-header--open { border-bottom-color: var(--color-status-open); color: var(--color-status-open); }
    .column-header--active { border-bottom-color: var(--color-status-active); color: var(--color-status-active); }
    .column-header--closed { border-bottom-color: var(--color-status-closed); color: var(--color-status-closed); }
    .column-title { display: flex; align-items: center; gap: 8px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
    .count {
      background: rgba(0,0,0,0.08);
      border-radius: 10px;
      padding: 1px 7px;
      font-size: 11px;
    }
    .add-btn { width: 28px; height: 28px; line-height: 28px; }
    .column-body {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      max-height: calc(100vh - 180px);
      min-height: 100px;
    }
    .column-body.cdk-drop-list-dragging .task-card:not(.cdk-drag-placeholder) { transition: transform 250ms cubic-bezier(0,0,0.2,1); }
    .empty-column { text-align: center; color: #a19f9d; font-size: 13px; padding: 24px 0; border: 2px dashed #edebe9; border-radius: 6px; }
  `]
})
export class BoardColumnComponent {
  @Input() status!: TaskStatus;
  @Input() tasks: Task[] = [];
  @Input() listId!: string;
  @Input() connectedLists: string[] = [];
  @Output() dropped = new EventEmitter<CdkDragDrop<TaskStatus>>();
  @Output() addTask = new EventEmitter<void>();

  get label(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }
}

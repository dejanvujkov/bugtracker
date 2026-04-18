import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService, EpicHasOpenChildrenError } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TaskStatus, Project, BoardData } from '../../../core/models';
import { BoardColumnComponent } from '../board-column/board-column.component';
import { TaskCreateComponent } from '../../tasks/task-create/task-create.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatIconModule, MatButtonModule, MatToolbarModule, MatSelectModule,
    MatFormFieldModule, MatSnackBarModule, MatDialogModule, MatTooltipModule,
    DragDropModule, BoardColumnComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="board-page">
      <div class="board-toolbar">
        <div class="board-title-row">
          <mat-icon class="board-icon">dashboard</mat-icon>
          <h1 class="board-title">{{ project()?.name || 'Loading...' }}</h1>
          @if (project()?.description) {
            <span class="board-desc">{{ project()?.description }}</span>
          }
        </div>
        <div class="board-actions">
          <mat-form-field appearance="outline" class="epic-filter">
            <mat-label>Epic</mat-label>
            <mat-select [(ngModel)]="epicFilter" (ngModelChange)="load()">
              <mat-option value="">All Tasks</mat-option>
              @for (e of epics(); track e.id) {
                <mat-option [value]="e.id">{{ e.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <a mat-button [routerLink]="['/projects', projectId, 'settings']" matTooltip="Settings">
            <mat-icon>settings</mat-icon> Settings
          </a>

          <button mat-flat-button color="primary" (click)="openCreate()">
            <mat-icon>add</mat-icon> New Task
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Loading board…</div>
      } @else {
        <div class="board-columns">
          @for (col of columns; track col.status) {
            <app-board-column
              [status]="col.status"
              [tasks]="boardData()[col.status]"
              [listId]="col.status + '-list'"
              [connectedLists]="['open-list', 'active-list', 'closed-list']"
              (dropped)="onDrop($event)"
              (addTask)="openCreate(col.status)">
            </app-board-column>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .board-page { padding: 24px; min-height: 100vh; }
    .board-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .board-title-row { display: flex; align-items: center; gap: 12px; }
    .board-icon { color: var(--color-primary); font-size: 28px; }
    .board-title { margin: 0; font-size: 22px; font-weight: 700; }
    .board-desc { color: #605e5c; font-size: 14px; }
    .board-actions { display: flex; align-items: center; gap: 8px; }
    .epic-filter { width: 180px; }
    .board-columns { display: flex; gap: 16px; align-items: flex-start; overflow-x: auto; padding-bottom: 16px; }
    .loading { text-align: center; padding: 64px; color: #605e5c; font-size: 16px; }
  `]
})
export class BoardComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private projectService = inject(ProjectService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  projectId = '';
  project = signal<Project | null>(null);
  epics = signal<Task[]>([]);
  boardData = signal<BoardData>({ open: [], active: [], closed: [] });
  loading = signal(true);
  epicFilter = '';

  columns: { status: TaskStatus }[] = [
    { status: 'open' },
    { status: 'active' },
    { status: 'closed' },
  ];

  async ngOnInit(): Promise<void> {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    const [proj, epics] = await Promise.all([
      this.projectService.getById(this.projectId),
      this.taskService.getEpics(this.projectId),
    ]);
    this.project.set(proj);
    this.epics.set(epics);
    await this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      const data = await this.taskService.getBoardData(this.projectId, this.epicFilter || undefined);
      this.boardData.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(status: TaskStatus = 'open'): void {
    const ref = this.dialog.open(TaskCreateComponent, {
      width: '560px',
      data: { projectId: this.projectId, defaultStatus: status, epics: this.epics() }
    });
    ref.afterClosed().subscribe(created => {
      if (created) this.load();
    });
  }

  async onDrop(event: CdkDragDrop<TaskStatus>): Promise<void> {
    const task = event.item.data as Task;
    const bd = { ...this.boardData() };
    const sourceStatus = event.previousContainer.data as TaskStatus;
    const targetStatus = event.container.data as TaskStatus;

    if (sourceStatus === targetStatus) {
      // Reorder within same column
      const col = [...bd[sourceStatus]];
      moveItemInArray(col, event.previousIndex, event.currentIndex);
      this.boardData.set({ ...bd, [sourceStatus]: col });
      await this.taskService.reorderColumn(this.projectId, sourceStatus, col.map(t => t.id));
    } else {
      // Move between columns — optimistic update
      const srcCol = [...bd[sourceStatus]];
      const tgtCol = [...bd[targetStatus]];
      transferArrayItem(srcCol, tgtCol, event.previousIndex, event.currentIndex);
      this.boardData.set({ ...bd, [sourceStatus]: srcCol, [targetStatus]: tgtCol });

      try {
        await this.taskService.changeStatus(task.id, targetStatus);
        await this.taskService.reorderColumn(this.projectId, targetStatus, tgtCol.map(t => t.id));
      } catch (err: any) {
        // Rollback
        const rollback = { ...this.boardData() };
        const rs = [...rollback[targetStatus]];
        const rp = [...rollback[sourceStatus]];
        transferArrayItem(rs, rp, event.currentIndex, event.previousIndex);
        this.boardData.set({ ...rollback, [targetStatus]: rs, [sourceStatus]: rp });

        const msg = err instanceof EpicHasOpenChildrenError
          ? 'Close all child tasks before closing this epic'
          : 'Failed to update status';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
      }
    }
    this.cdr.markForCheck();
  }
}

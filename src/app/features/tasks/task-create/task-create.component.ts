import { Component, Inject, signal, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskService } from '../../../core/services/task.service';
import { UserService } from '../../../core/services/user.service';
import { Task, User, TaskStatus } from '../../../core/models';
import { MarkdownEditorComponent } from '../../../shared/components/markdown-editor/markdown-editor.component';

export interface TaskCreateData {
  projectId: string;
  defaultStatus: TaskStatus;
  epics: Task[];
}

@Component({
  selector: 'app-task-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSelectModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatSnackBarModule, MarkdownEditorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.defaultStatus === 'open' ? 'New Task' : 'New Task' }}</h2>
    <mat-dialog-content>
      <div class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput [(ngModel)]="title" required placeholder="Short, descriptive title">
        </mat-form-field>

        <div class="checkbox-row">
          <mat-checkbox [(ngModel)]="isEpic" color="primary">This is an Epic</mat-checkbox>
        </div>

        @if (!isEpic) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Epic (optional)</mat-label>
            <mat-select [(ngModel)]="epicId">
              <mat-option value="">— No Epic —</mat-option>
              @for (e of data.epics; track e.id) {
                <mat-option [value]="e.id">{{ e.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Assignee (optional)</mat-label>
          <mat-select [(ngModel)]="assigneeId">
            <mat-option value="">— Unassigned —</mat-option>
            @for (u of users(); track u.id) {
              <mat-option [value]="u.id">{{ u.fullName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="status">
            <mat-option value="open">Open</mat-option>
            <mat-option value="active">Active</mat-option>
            <mat-option value="closed">Closed</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="desc-label">Description</div>
        <app-markdown-editor [(ngModel)]="description" placeholder="Describe the task…"></app-markdown-editor>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="!title || loading()" (click)="create()">
        @if (loading()) { <mat-spinner diameter="16"></mat-spinner> } @else { Create }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; min-width: 480px; }
    .full-width { width: 100%; }
    .checkbox-row { padding: 4px 0; }
    .desc-label { font-size: 13px; color: #605e5c; margin-bottom: 4px; }
    .error-msg { color: #d83b01; font-size: 13px; }
  `]
})
export class TaskCreateComponent implements OnInit {
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<TaskCreateComponent>);

  title = '';
  description = '';
  isEpic = false;
  epicId = '';
  assigneeId = '';
  status: TaskStatus;
  loading = signal(false);
  error = signal('');
  users = signal<User[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public data: TaskCreateData) {
    this.status = data.defaultStatus;
  }

  async ngOnInit(): Promise<void> {
    const users = await this.userService.getByProject(this.data.projectId);
    this.users.set(users);
  }

  async create(): Promise<void> {
    if (!this.title.trim()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.taskService.create({
        projectId: this.data.projectId,
        title: this.title.trim(),
        description: this.description || null,
        isEpic: this.isEpic,
        epicId: !this.isEpic && this.epicId ? this.epicId : null,
        assigneeId: this.assigneeId || null,
        status: this.status,
      });
      this.dialogRef.close(true);
    } catch (e: any) {
      this.error.set(e.message || 'Failed to create task');
    } finally {
      this.loading.set(false);
    }
  }
}

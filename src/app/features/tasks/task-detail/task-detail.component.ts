import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TaskService } from '../../../core/services/task.service';
import { CommentService } from '../../../core/services/comment.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Task, Comment, User, TaskStatus } from '../../../core/models';
import { MarkdownEditorComponent } from '../../../shared/components/markdown-editor/markdown-editor.component';
import { MarkdownViewerComponent } from '../../../shared/components/markdown-viewer/markdown-viewer.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    MatChipsModule, MatDividerModule, MatSnackBarModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule,
    MarkdownEditorComponent, MarkdownViewerComponent, AvatarComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (task()) {
      <div class="task-page">
        <!-- Header -->
        <div class="task-header">
          <a [routerLink]="['/projects', task()!.projectId]" class="back-link">
            <mat-icon>arrow_back</mat-icon> Back to Board
          </a>
          <div class="header-row">
            <div class="header-left">
              @if (task()!.isEpic) {
                <span class="epic-chip"><mat-icon>auto_awesome</mat-icon> EPIC</span>
              }
              @if (editingTitle()) {
                <input class="title-input" [(ngModel)]="editTitle" (blur)="saveTitle()" (keyup.enter)="saveTitle()" autofocus>
              } @else {
                <h1 class="task-title" (click)="startEditTitle()">{{ task()!.title }}</h1>
              }
            </div>
            <div class="header-right">
              <mat-form-field appearance="outline" class="status-select">
                <mat-label>Status</mat-label>
                <mat-select [(ngModel)]="currentStatus" (ngModelChange)="changeStatus($event)">
                  <mat-option value="open">Open</mat-option>
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="closed">Closed</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <div class="meta-row">
            <!-- Epic parent -->
            @if (task()!.epic) {
              <div class="meta-item">
                <mat-icon>auto_awesome</mat-icon>
                <span>Epic: </span>
                <a [routerLink]="['/projects', task()!.projectId, 'epics', task()!.epicId]" class="epic-link">
                  {{ task()!.epic!.title }}
                </a>
              </div>
            }
            <!-- Assignee -->
            <div class="meta-item">
              <mat-icon>person</mat-icon>
              <mat-form-field appearance="outline" class="assignee-select">
                <mat-label>Assignee</mat-label>
                <mat-select [(ngModel)]="assigneeId" (ngModelChange)="saveAssignee($event)">
                  <mat-option value="">Unassigned</mat-option>
                  @for (u of users(); track u.id) {
                    <mat-option [value]="u.id">{{ u.fullName }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
            <!-- Epic filter link (if epic) -->
            @if (task()!.isEpic) {
              <a class="meta-item" [routerLink]="['/projects', task()!.projectId, 'epics', task()!.id]">
                <mat-icon>list</mat-icon> View child tasks
              </a>
            }
          </div>
        </div>

        <!-- Description -->
        <div class="section-card">
          <div class="section-header">
            <h2>Description</h2>
            <button mat-button (click)="editDesc.set(!editDesc())">
              <mat-icon>{{ editDesc() ? 'close' : 'edit' }}</mat-icon>
              {{ editDesc() ? 'Cancel' : 'Edit' }}
            </button>
          </div>
          @if (editDesc()) {
            <app-markdown-editor [(ngModel)]="descValue" placeholder="Describe the task…"></app-markdown-editor>
            <div class="desc-actions">
              <button mat-flat-button color="primary" (click)="saveDesc()">Save</button>
              <button mat-button (click)="editDesc.set(false)">Cancel</button>
            </div>
          } @else {
            <div class="desc-view">
              @if (task()!.description) {
                <app-markdown-viewer [content]="task()!.description!"></app-markdown-viewer>
              } @else {
                <p class="empty-desc">No description yet. Click Edit to add one.</p>
              }
            </div>
          }
        </div>

        <!-- Comments -->
        <div class="section-card">
          <h2>Comments ({{ comments().length }})</h2>
          <mat-divider></mat-divider>

          @for (comment of comments(); track comment.id) {
            <div class="comment">
              <app-avatar [user]="comment.author ?? null" [size]="36"></app-avatar>
              <div class="comment-body">
                <div class="comment-meta">
                  <strong>{{ comment.author?.fullName }}</strong>
                  <span class="comment-date">{{ comment.createdAt | date:'medium' }}</span>
                  @if (canEditComment(comment)) {
                    <button mat-icon-button class="comment-action" (click)="startEditComment(comment)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button class="comment-action" color="warn" (click)="deleteComment(comment)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </div>
                @if (editingCommentId() === comment.id) {
                  <app-markdown-editor [(ngModel)]="editCommentBody"></app-markdown-editor>
                  <div class="comment-edit-actions">
                    <button mat-flat-button color="primary" (click)="saveComment(comment)">Save</button>
                    <button mat-button (click)="editingCommentId.set(null)">Cancel</button>
                  </div>
                } @else {
                  <app-markdown-viewer [content]="comment.body"></app-markdown-viewer>
                }
              </div>
            </div>
            <mat-divider></mat-divider>
          }

          <!-- New comment -->
          <div class="new-comment">
            <app-avatar [user]="auth.currentUser()" [size]="36"></app-avatar>
            <div class="new-comment-input">
              <app-markdown-editor [(ngModel)]="newComment" placeholder="Add a comment…"></app-markdown-editor>
              <div class="comment-edit-actions">
                <button mat-flat-button color="primary" [disabled]="!newComment.trim()" (click)="postComment()">
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    }
  `,
  styles: [`
    .task-page { padding: 24px 32px; max-width: 900px; }
    .back-link { display: flex; align-items: center; gap: 4px; color: var(--color-primary); text-decoration: none; font-size: 14px; margin-bottom: 16px; }
    .task-header { background: white; border-radius: 8px; box-shadow: var(--shadow-card); padding: 24px; margin-bottom: 20px; }
    .header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
    .header-left { flex: 1; display: flex; align-items: center; gap: 12px; }
    .epic-chip { display: flex; align-items: center; gap: 4px; background: #f0eaf8; color: var(--color-epic); border-radius: 12px; padding: 2px 10px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .epic-chip mat-icon { font-size: 14px; }
    .task-title { margin: 0; font-size: 20px; font-weight: 700; cursor: pointer; }
    .task-title:hover { color: var(--color-primary); }
    .title-input { font-size: 20px; font-weight: 700; border: 2px solid var(--color-primary); border-radius: 4px; padding: 4px 8px; outline: none; width: 100%; }
    .status-select { width: 140px; }
    .meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 16px; }
    .meta-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #605e5c; }
    .meta-item mat-icon { font-size: 16px; }
    .assignee-select { width: 180px; }
    .epic-link { color: var(--color-epic); text-decoration: none; font-weight: 600; }
    .section-card { background: white; border-radius: 8px; box-shadow: var(--shadow-card); padding: 24px; margin-bottom: 20px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .section-header h2, .section-card h2 { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .desc-view { min-height: 40px; }
    .empty-desc { color: #a19f9d; font-style: italic; margin: 0; }
    .desc-actions { display: flex; gap: 8px; margin-top: 12px; }
    .comment { display: flex; gap: 12px; padding: 16px 0; }
    .comment-body { flex: 1; }
    .comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
    .comment-date { color: #a19f9d; }
    .comment-action { width: 24px; height: 24px; line-height: 24px; }
    .comment-action mat-icon { font-size: 16px; }
    .comment-edit-actions { display: flex; gap: 8px; margin-top: 10px; }
    .new-comment { display: flex; gap: 12px; padding: 20px 0 0; }
    .new-comment-input { flex: 1; }
    .loading-state { display: flex; justify-content: center; padding: 100px; }
  `]
})
export class TaskDetailComponent implements OnInit {
  auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private taskService = inject(TaskService);
  private commentService = inject(CommentService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  task = signal<Task | null>(null);
  comments = signal<Comment[]>([]);
  users = signal<User[]>([]);

  currentStatus: TaskStatus = 'open';
  assigneeId = '';
  editDesc = signal(false);
  descValue = '';
  newComment = '';
  editingTitle = signal(false);
  editTitle = '';
  editingCommentId = signal<string | null>(null);
  editCommentBody = '';

  async ngOnInit(): Promise<void> {
    const taskId = this.route.snapshot.paramMap.get('taskId')!;
    const projectId = this.route.snapshot.paramMap.get('projectId')!;
    const [task, comments, users] = await Promise.all([
      this.taskService.getById(taskId),
      this.commentService.getByTask(taskId),
      this.userService.getByProject(projectId),
    ]);
    this.task.set(task);
    this.comments.set(comments);
    this.users.set(users);
    if (task) {
      this.currentStatus = task.status;
      this.assigneeId = task.assigneeId || '';
      this.descValue = task.description || '';
    }
    this.cdr.markForCheck();
  }

  startEditTitle(): void {
    this.editTitle = this.task()!.title;
    this.editingTitle.set(true);
  }

  async saveTitle(): Promise<void> {
    if (!this.editTitle.trim()) return;
    await this.taskService.update(this.task()!.id, { title: this.editTitle.trim() });
    const updated = await this.taskService.getById(this.task()!.id);
    this.task.set(updated);
    this.editingTitle.set(false);
    this.cdr.markForCheck();
  }

  async changeStatus(status: TaskStatus): Promise<void> {
    try {
      const updated = await this.taskService.changeStatus(this.task()!.id, status);
      this.task.set(updated);
      this.currentStatus = updated.status;
      this.cdr.markForCheck();
    } catch (e: any) {
      this.currentStatus = this.task()!.status; // revert
      this.snackBar.open(
        e.message === 'EPIC_HAS_OPEN_CHILDREN'
          ? 'Close all child tasks before closing this epic'
          : 'Failed to change status',
        'OK', { duration: 4000 }
      );
      this.cdr.markForCheck();
    }
  }

  async saveAssignee(userId: string): Promise<void> {
    await this.taskService.update(this.task()!.id, { assigneeId: userId || null });
  }

  async saveDesc(): Promise<void> {
    await this.taskService.update(this.task()!.id, { description: this.descValue });
    const updated = await this.taskService.getById(this.task()!.id);
    this.task.set(updated);
    this.editDesc.set(false);
    this.cdr.markForCheck();
  }

  async postComment(): Promise<void> {
    if (!this.newComment.trim()) return;
    const comment = await this.commentService.create(this.task()!.id, this.newComment);
    this.comments.update(c => [...c, comment]);
    this.newComment = '';
    this.cdr.markForCheck();
  }

  canEditComment(comment: Comment): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    return comment.authorId === user.id || user.role === 'superuser' || user.role === 'project_admin';
  }

  startEditComment(comment: Comment): void {
    this.editCommentBody = comment.body;
    this.editingCommentId.set(comment.id);
  }

  async saveComment(comment: Comment): Promise<void> {
    const updated = await this.commentService.update(comment.id, this.editCommentBody);
    this.comments.update(list => list.map(c => c.id === comment.id ? updated! : c));
    this.editingCommentId.set(null);
    this.cdr.markForCheck();
  }

  deleteComment(comment: Comment): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Comment', message: 'Delete this comment?', confirmLabel: 'Delete', danger: true }
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (confirmed) {
        await this.commentService.delete(comment.id);
        this.comments.update(list => list.filter(c => c.id !== comment.id));
        this.cdr.markForCheck();
      }
    });
  }
}

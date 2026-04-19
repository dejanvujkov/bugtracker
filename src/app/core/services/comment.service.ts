import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Comment } from '../models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  async getByTask(taskId: string): Promise<Comment[]> {
    return this.repos.comments.findByTask(taskId);
  }

  async create(taskId: string, body: string): Promise<Comment> {
    const user = this.auth.currentUser()!;
    const comment = await this.repos.comments.create({ id: uuidv4(), taskId, authorId: user.id, body });
    this.notifications.add(user.id, 'info', 'comment', 'Comment added');
    return comment;
  }

  async update(id: string, body: string): Promise<Comment | null> {
    const uid = this.auth.currentUser()?.id ?? '';
    const comment = await this.repos.comments.update(id, { body });
    if (comment) this.notifications.add(uid, 'info', 'comment', 'Comment updated');
    return comment;
  }

  async delete(id: string): Promise<boolean> {
    const uid = this.auth.currentUser()?.id ?? '';
    const result = await this.repos.comments.delete(id);
    if (result) this.notifications.add(uid, 'info', 'comment', 'Comment deleted');
    return result;
  }
}

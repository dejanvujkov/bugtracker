import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { Comment } from '../models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);

  async getByTask(taskId: string): Promise<Comment[]> {
    return this.repos.comments.findByTask(taskId);
  }

  async create(taskId: string, body: string): Promise<Comment> {
    const user = this.auth.currentUser()!;
    return this.repos.comments.create({
      id: uuidv4(),
      taskId,
      authorId: user.id,
      body,
    });
  }

  async update(id: string, body: string): Promise<Comment | null> {
    return this.repos.comments.update(id, { body });
  }

  async delete(id: string): Promise<boolean> {
    return this.repos.comments.delete(id);
  }
}

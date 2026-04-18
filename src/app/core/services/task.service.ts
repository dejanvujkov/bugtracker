import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus, BoardData } from '../models';

export class EpicHasOpenChildrenError extends Error {
  constructor() {
    super('EPIC_HAS_OPEN_CHILDREN');
  }
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);

  async getBoardData(projectId: string, epicId?: string): Promise<BoardData> {
    return this.repos.tasks.getBoardData(projectId, epicId);
  }

  async getById(id: string): Promise<Task | null> {
    return this.repos.tasks.findById(id);
  }

  async getEpics(projectId: string): Promise<Task[]> {
    return this.repos.tasks.findEpics(projectId);
  }

  async getChildTasks(epicId: string): Promise<Task[]> {
    return this.repos.tasks.findByEpic(epicId);
  }

  async create(dto: Omit<CreateTaskDTO, 'id' | 'createdBy'>): Promise<Task> {
    const user = this.auth.currentUser()!;
    return this.repos.tasks.create({
      ...dto,
      id: uuidv4(),
      createdBy: user.id,
    });
  }

  async update(id: string, dto: UpdateTaskDTO): Promise<Task | null> {
    return this.repos.tasks.update(id, dto);
  }

  async changeStatus(taskId: string, newStatus: TaskStatus): Promise<Task> {
    const task = await this.repos.tasks.findById(taskId);
    if (!task) throw new Error('Task not found');

    if (task.isEpic && newStatus === 'closed') {
      const allClosed = await this.repos.tasks.allChildrenClosed(taskId);
      if (!allClosed) throw new EpicHasOpenChildrenError();
    }

    const updated = await this.repos.tasks.updateStatus(taskId, newStatus);
    return updated!;
  }

  async reorderColumn(projectId: string, status: TaskStatus, orderedIds: string[]): Promise<void> {
    return this.repos.tasks.reorderColumn(projectId, status, orderedIds);
  }

  async delete(id: string): Promise<boolean> {
    return this.repos.tasks.delete(id);
  }
}

import { IRepository } from './IRepository';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus } from '../../core/models';

export interface ITaskRepository extends IRepository<Task, CreateTaskDTO, UpdateTaskDTO> {
  findByProject(projectId: string, status?: TaskStatus): Promise<Task[]>;
  findByEpic(epicId: string): Promise<Task[]>;
  findEpics(projectId: string): Promise<Task[]>;
  updateStatus(id: string, status: TaskStatus): Promise<Task | null>;
  reorderColumn(projectId: string, status: TaskStatus, orderedIds: string[]): Promise<void>;
  allChildrenClosed(epicId: string): Promise<boolean>;
  getBoardData(projectId: string, epicId?: string): Promise<{ open: Task[]; active: Task[]; closed: Task[] }>;
}

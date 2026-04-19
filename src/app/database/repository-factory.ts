import { InjectionToken } from '@angular/core';
import { SqliteDriver } from './sqlite/sqlite.driver';
import { SqliteUserRepository } from './sqlite/SqliteUserRepository';
import { SqliteProjectRepository } from './sqlite/SqliteProjectRepository';
import { SqliteProjectMemberRepository } from './sqlite/SqliteProjectMemberRepository';
import { SqliteTaskRepository } from './sqlite/SqliteTaskRepository';
import { SqliteCommentRepository } from './sqlite/SqliteCommentRepository';
import { SqliteNotificationRepository } from './sqlite/SqliteNotificationRepository';
import { IUserRepository } from './interfaces/IUserRepository';
import { IProjectRepository } from './interfaces/IProjectRepository';
import { IProjectMemberRepository } from './interfaces/IProjectMemberRepository';
import { ITaskRepository } from './interfaces/ITaskRepository';
import { ICommentRepository } from './interfaces/ICommentRepository';
import { INotificationRepository } from './interfaces/INotificationRepository';

export type DbType = 'sqlite'; // extend with 'sqlserver' | 'rest' etc. when needed

export interface RepositoryContainer {
  users: IUserRepository;
  projects: IProjectRepository;
  members: IProjectMemberRepository;
  tasks: ITaskRepository;
  comments: ICommentRepository;
  notifications: INotificationRepository;
}

export const REPOS = new InjectionToken<RepositoryContainer>('REPOS');

export function createRepositories(driver: SqliteDriver, dbType: DbType = 'sqlite'): RepositoryContainer {
  if (dbType === 'sqlite') {
    return {
      users: new SqliteUserRepository(driver),
      projects: new SqliteProjectRepository(driver),
      members: new SqliteProjectMemberRepository(driver),
      tasks: new SqliteTaskRepository(driver),
      comments: new SqliteCommentRepository(driver),
      notifications: new SqliteNotificationRepository(driver),
    };
  }
  throw new Error(`Unsupported db type: ${dbType}`);
}

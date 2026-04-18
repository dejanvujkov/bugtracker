export type UserRole = 'superuser' | 'project_admin' | 'member';
export type ProjectRole = 'project_admin' | 'member';
export type TaskStatus = 'open' | 'active' | 'closed';

export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectRole;
  joinedAt: string;
  user?: User;
}

export interface Task {
  id: string;
  projectId: string;
  epicId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  isEpic: boolean;
  assigneeId: string | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  epic?: Task;
  childCount?: number;
  closedChildCount?: number;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface BoardData {
  open: Task[];
  active: Task[];
  closed: Task[];
}

export interface CreateUserDTO {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  isActive?: boolean;
}

export interface UpdateUserDTO {
  email?: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface CreateProjectDTO {
  id: string;
  name: string;
  description?: string | null;
  createdBy: string;
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string | null;
}

export interface CreateTaskDTO {
  id: string;
  projectId: string;
  epicId?: string | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  isEpic?: boolean;
  assigneeId?: string | null;
  position?: number;
  createdBy: string;
}

export interface UpdateTaskDTO {
  epicId?: string | null;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assigneeId?: string | null;
  position?: number;
}

export interface CreateCommentDTO {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
}

export interface UpdateCommentDTO {
  body?: string;
}

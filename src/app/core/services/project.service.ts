import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { Project, CreateProjectDTO, UpdateProjectDTO, ProjectRole } from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  async getAll(): Promise<Project[]> {
    const user = this.auth.currentUser();
    if (!user) return [];
    if (user.role === 'superuser') {
      return this.repos.projects.findAll();
    }
    return this.repos.projects.findByMember(user.id);
  }

  async getById(id: string): Promise<Project | null> {
    return this.repos.projects.findById(id);
  }

  async create(name: string, description?: string): Promise<Project> {
    const user = this.auth.currentUser()!;
    const dto: CreateProjectDTO = {
      id: uuidv4(),
      name,
      description: description || null,
      createdBy: user.id,
    };
    try {
      const project = await this.repos.projects.create(dto);
      this.notifications.add(user.id, 'success', 'project', `Project "${project.name}" created`);
      return project;
    } catch (e: any) {
      this.notifications.add(user.id, 'error', 'project', `Failed to create project: ${e.message}`);
      throw e;
    }
  }

  async update(id: string, dto: UpdateProjectDTO): Promise<Project | null> {
    const uid = this.auth.currentUser()?.id ?? '';
    const project = await this.repos.projects.update(id, dto);
    if (project) this.notifications.add(uid, 'info', 'project', `Project "${project.name}" updated`);
    return project;
  }

  async delete(id: string): Promise<boolean> {
    const uid = this.auth.currentUser()?.id ?? '';
    const project = await this.repos.projects.findById(id);
    const result = await this.repos.projects.delete(id);
    if (result) this.notifications.add(uid, 'info', 'project', `Project "${project?.name}" deleted`);
    return result;
  }

  async getMembers(projectId: string) {
    return this.repos.members.getMembers(projectId);
  }

  async addMember(projectId: string, userId: string, role: ProjectRole) {
    const uid = this.auth.currentUser()?.id ?? '';
    const member = await this.repos.members.addMember(projectId, userId, role);
    this.notifications.add(uid, 'info', 'project', 'Member added to project');
    return member;
  }

  async removeMember(projectId: string, userId: string) {
    const uid = this.auth.currentUser()?.id ?? '';
    const result = await this.repos.members.removeMember(projectId, userId);
    this.notifications.add(uid, 'info', 'project', 'Member removed from project');
    return result;
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    const uid = this.auth.currentUser()?.id ?? '';
    const result = await this.repos.members.updateRole(projectId, userId, role);
    this.notifications.add(uid, 'info', 'project', `Member role updated to ${role}`);
    return result;
  }

  async getUserMembership(projectId: string, userId: string) {
    return this.repos.members.getMembership(projectId, userId);
  }

  async canAccess(projectId: string): Promise<boolean> {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (user.role === 'superuser') return true;
    const membership = await this.repos.members.getMembership(projectId, user.id);
    return membership !== null;
  }
}

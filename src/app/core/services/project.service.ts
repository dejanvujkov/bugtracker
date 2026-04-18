import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { Project, CreateProjectDTO, UpdateProjectDTO, ProjectRole } from '../models';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);

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
    const project = await this.repos.projects.create(dto);
    return project;
  }

  async update(id: string, dto: UpdateProjectDTO): Promise<Project | null> {
    return this.repos.projects.update(id, dto);
  }

  async delete(id: string): Promise<boolean> {
    return this.repos.projects.delete(id);
  }

  async getMembers(projectId: string) {
    return this.repos.members.getMembers(projectId);
  }

  async addMember(projectId: string, userId: string, role: ProjectRole) {
    return this.repos.members.addMember(projectId, userId, role);
  }

  async removeMember(projectId: string, userId: string) {
    return this.repos.members.removeMember(projectId, userId);
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    return this.repos.members.updateRole(projectId, userId, role);
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

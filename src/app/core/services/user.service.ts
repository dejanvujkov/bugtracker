import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';
import { User, CreateUserDTO, UpdateUserDTO, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  async getAll(): Promise<User[]> {
    return this.repos.users.findAll();
  }

  async getById(id: string): Promise<User | null> {
    return this.repos.users.findById(id);
  }

  async getByProject(projectId: string): Promise<User[]> {
    return this.repos.users.findByProject(projectId);
  }

  async create(data: { email: string; password: string; fullName: string; role?: UserRole }): Promise<User> {
    const currentUser = this.auth.currentUser()!;
    const hash = await bcrypt.hash(data.password, 10);
    const role: UserRole =
      currentUser.role === 'superuser' ? (data.role || 'member') : 'member';

    const dto: CreateUserDTO = {
      id: uuidv4(),
      email: data.email,
      password: hash,
      fullName: data.fullName,
      role,
    };
    try {
      const user = await this.repos.users.create(dto);
      this.notifications.add(currentUser.id, 'success', 'user', `User "${user.fullName}" created`);
      return user;
    } catch (e: any) {
      this.notifications.add(currentUser.id, 'error', 'user', `Failed to create user: ${e.message}`);
      throw e;
    }
  }

  async update(id: string, data: UpdateUserDTO & { newPassword?: string }): Promise<User | null> {
    const uid = this.auth.currentUser()?.id ?? '';
    const dto: UpdateUserDTO = { ...data };
    if (data.newPassword) {
      dto.password = await bcrypt.hash(data.newPassword, 10);
    }
    delete (dto as any).newPassword;
    const user = await this.repos.users.update(id, dto);
    if (user) this.notifications.add(uid, 'info', 'user', `User "${user.fullName}" updated`);
    return user;
  }

  async deactivate(id: string): Promise<boolean> {
    const uid = this.auth.currentUser()?.id ?? '';
    const user = await this.repos.users.update(id, { isActive: false });
    if (user) this.notifications.add(uid, 'info', 'user', `User "${user.fullName}" deactivated`);
    return !!user;
  }

  async reactivate(id: string): Promise<boolean> {
    const uid = this.auth.currentUser()?.id ?? '';
    const user = await this.repos.users.update(id, { isActive: true });
    if (user) this.notifications.add(uid, 'info', 'user', `User "${user.fullName}" activated`);
    return !!user;
  }

  async deleteUser(targetUserId: string, projectId?: string): Promise<{ success: boolean; error?: string }> {
    const currentUser = this.auth.currentUser()!;

    if (currentUser.id === targetUserId) {
      return { success: false, error: 'You cannot delete your own account' };
    }

    const target = await this.repos.users.findById(targetUserId);
    if (!target) return { success: false, error: 'User not found' };

    if (currentUser.role === 'superuser') {
      if (target.role === 'superuser') {
        return { success: false, error: 'Cannot delete a superuser account' };
      }
      const result = await this.repos.users.hardDelete(targetUserId);
      if (result.success) {
        this.notifications.add(currentUser.id, 'info', 'user', `User "${target.fullName}" deleted`);
      } else {
        this.notifications.add(currentUser.id, 'error', 'user', result.error ?? 'Failed to delete user');
      }
      return result;
    }

    if (currentUser.role === 'project_admin' && projectId) {
      const adminMembership = await this.repos.members.getMembership(projectId, currentUser.id);
      if (!adminMembership || adminMembership.role !== 'project_admin') {
        return { success: false, error: 'You are not an admin of this project' };
      }

      const targetMembership = await this.repos.members.getMembership(projectId, targetUserId);
      if (!targetMembership) {
        return { success: false, error: 'User is not a member of this project' };
      }

      if (target.role !== 'member') {
        return { success: false, error: 'You can only delete regular members' };
      }

      const result = await this.repos.users.hardDelete(targetUserId);
      if (result.success) {
        this.notifications.add(currentUser.id, 'info', 'user', `User "${target.fullName}" deleted`);
      } else {
        this.notifications.add(currentUser.id, 'error', 'user', result.error ?? 'Failed to delete user');
      }
      return result;
    }

    return { success: false, error: 'Insufficient permissions' };
  }
}

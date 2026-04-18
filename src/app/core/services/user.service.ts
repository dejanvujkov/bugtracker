import { inject, Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { REPOS } from '../../database/repository-factory';
import { AuthService } from './auth.service';
import { User, CreateUserDTO, UpdateUserDTO, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private repos = inject(REPOS);
  private auth = inject(AuthService);

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
    return this.repos.users.create(dto);
  }

  async update(id: string, data: UpdateUserDTO & { newPassword?: string }): Promise<User | null> {
    const dto: UpdateUserDTO = { ...data };
    if (data.newPassword) {
      dto.password = await bcrypt.hash(data.newPassword, 10);
    }
    delete (dto as any).newPassword;
    return this.repos.users.update(id, dto);
  }

  async deactivate(id: string): Promise<boolean> {
    return this.repos.users.update(id, { isActive: false }).then(u => !!u);
  }

  async reactivate(id: string): Promise<boolean> {
    return this.repos.users.update(id, { isActive: true }).then(u => !!u);
  }
}

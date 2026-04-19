import { IRepository } from './IRepository';
import { User, CreateUserDTO, UpdateUserDTO } from '../../core/models';

export interface IUserRepository extends IRepository<User, CreateUserDTO, UpdateUserDTO> {
  findByEmail(email: string): Promise<User | null>;
  findByProject(projectId: string): Promise<User[]>;
  hardDelete(id: string): Promise<{ success: boolean; error?: string }>;
}

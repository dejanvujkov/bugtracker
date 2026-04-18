import { IRepository } from './IRepository';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '../../core/models';

export interface IProjectRepository extends IRepository<Project, CreateProjectDTO, UpdateProjectDTO> {
  findByMember(userId: string): Promise<Project[]>;
}

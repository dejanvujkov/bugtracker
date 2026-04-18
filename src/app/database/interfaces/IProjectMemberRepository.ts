import { ProjectMember, ProjectRole } from '../../core/models';

export interface IProjectMemberRepository {
  addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember>;
  removeMember(projectId: string, userId: string): Promise<boolean>;
  updateRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember | null>;
  getMembers(projectId: string): Promise<ProjectMember[]>;
  getMembership(projectId: string, userId: string): Promise<ProjectMember | null>;
}

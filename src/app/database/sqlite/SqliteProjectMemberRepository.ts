import { IProjectMemberRepository } from '../interfaces/IProjectMemberRepository';
import { ProjectMember, ProjectRole } from '../../core/models';
import { SqliteDriver } from './sqlite.driver';

function mapRow(row: Record<string, unknown>): ProjectMember {
  return {
    projectId: row['project_id'] as string,
    userId: row['user_id'] as string,
    role: row['role'] as ProjectRole,
    joinedAt: row['joined_at'] as string,
  };
}

function mapRowWithUser(row: Record<string, unknown>): ProjectMember {
  const member = mapRow(row);
  if (row['u_id']) {
    member.user = {
      id: row['u_id'] as string,
      email: row['u_email'] as string,
      password: '',
      fullName: row['u_full_name'] as string,
      role: row['u_role'] as any,
      isActive: row['u_is_active'] === 1,
      createdAt: row['u_created_at'] as string,
      updatedAt: row['u_updated_at'] as string,
    };
  }
  return member;
}

export class SqliteProjectMemberRepository implements IProjectMemberRepository {
  constructor(private driver: SqliteDriver) {}

  async addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    const now = new Date().toISOString();
    this.driver.run(
      `INSERT OR REPLACE INTO project_members (project_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?)`,
      [projectId, userId, role, now]
    );
    return (await this.getMembership(projectId, userId))!;
  }

  async removeMember(projectId: string, userId: string): Promise<boolean> {
    const existing = await this.getMembership(projectId, userId);
    if (!existing) return false;
    this.driver.run(
      `DELETE FROM project_members WHERE project_id = ? AND user_id = ?`,
      [projectId, userId]
    );
    return true;
  }

  async updateRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember | null> {
    const existing = await this.getMembership(projectId, userId);
    if (!existing) return null;
    this.driver.run(
      `UPDATE project_members SET role = ? WHERE project_id = ? AND user_id = ?`,
      [role, projectId, userId]
    );
    return this.getMembership(projectId, userId);
  }

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT pm.*,
         u.id as u_id, u.email as u_email, u.full_name as u_full_name,
         u.role as u_role, u.is_active as u_is_active,
         u.created_at as u_created_at, u.updated_at as u_updated_at
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ?
       ORDER BY u.full_name`,
      [projectId]
    );
    return rows.map(mapRowWithUser);
  }

  async getMembership(projectId: string, userId: string): Promise<ProjectMember | null> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT pm.*,
         u.id as u_id, u.email as u_email, u.full_name as u_full_name,
         u.role as u_role, u.is_active as u_is_active,
         u.created_at as u_created_at, u.updated_at as u_updated_at
       FROM project_members pm
       INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? AND pm.user_id = ?`,
      [projectId, userId]
    );
    return rows.length ? mapRowWithUser(rows[0]) : null;
  }
}

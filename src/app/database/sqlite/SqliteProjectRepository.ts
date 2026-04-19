import { v4 as uuidv4 } from 'uuid';
import { IProjectRepository } from '../interfaces/IProjectRepository';
import { Project, CreateProjectDTO, UpdateProjectDTO } from '../../core/models';
import { SqliteDriver } from './sqlite.driver';

function mapRow(row: Record<string, unknown>): Project {
  return {
    id: row['id'] as string,
    name: row['name'] as string,
    description: row['description'] as string | null,
    createdBy: row['created_by'] as string,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export class SqliteProjectRepository implements IProjectRepository {
  constructor(private driver: SqliteDriver) {}

  async findById(id: string): Promise<Project | null> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT * FROM projects WHERE id = ?`, [id]
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async findAll(): Promise<Project[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT * FROM projects ORDER BY name`
    );
    return rows.map(mapRow);
  }

  async findByMember(userId: string): Promise<Project[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT p.* FROM projects p
       INNER JOIN project_members pm ON pm.project_id = p.id
       WHERE pm.user_id = ?
       ORDER BY p.name`,
      [userId]
    );
    return rows.map(mapRow);
  }

  async create(dto: CreateProjectDTO): Promise<Project> {
    const now = new Date().toISOString();
    const id = dto.id || uuidv4();
    await this.driver.run(
      `INSERT INTO projects (id, name, description, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, dto.name, dto.description ?? null, dto.createdBy, now, now]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, dto: UpdateProjectDTO): Promise<Project | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();
    await this.driver.run(
      `UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
      [dto.name ?? current.name, dto.description !== undefined ? dto.description : current.description, now, id]
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const current = await this.findById(id);
    if (!current) return false;
    await this.driver.run(`DELETE FROM projects WHERE id = ?`, [id]);
    return true;
  }
}

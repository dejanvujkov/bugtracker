import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User, CreateUserDTO, UpdateUserDTO } from '../../core/models';
import { SqliteDriver } from './sqlite.driver';

function mapRow(row: Record<string, unknown>): User {
  return {
    id: row['id'] as string,
    email: row['email'] as string,
    password: row['password'] as string,
    fullName: row['full_name'] as string,
    role: row['role'] as User['role'],
    isActive: row['is_active'] === 1,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };
}

export class SqliteUserRepository implements IUserRepository {
  constructor(private driver: SqliteDriver) {}

  async findById(id: string): Promise<User | null> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT * FROM users WHERE id = ?`, [id]
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async findAll(): Promise<User[]> {
    const rows = this.driver.query<Record<string, unknown>>(`SELECT * FROM users ORDER BY full_name`);
    return rows.map(mapRow);
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT * FROM users WHERE email = ?`, [email]
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async findByProject(projectId: string): Promise<User[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT u.* FROM users u
       INNER JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = ?
       ORDER BY u.full_name`,
      [projectId]
    );
    return rows.map(mapRow);
  }

  async create(dto: CreateUserDTO): Promise<User> {
    const now = new Date().toISOString();
    const id = dto.id || uuidv4();
    this.driver.run(
      `INSERT INTO users (id, email, password, full_name, role, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, dto.email, dto.password, dto.fullName, dto.role, dto.isActive !== false ? 1 : 0, now, now]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, dto: UpdateUserDTO): Promise<User | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();
    this.driver.run(
      `UPDATE users SET
         email = ?, password = ?, full_name = ?, role = ?, is_active = ?, updated_at = ?
       WHERE id = ?`,
      [
        dto.email ?? current.email,
        dto.password ?? current.password,
        dto.fullName ?? current.fullName,
        dto.role ?? current.role,
        dto.isActive !== undefined ? (dto.isActive ? 1 : 0) : (current.isActive ? 1 : 0),
        now,
        id,
      ]
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const current = await this.findById(id);
    if (!current) return false;
    this.driver.run(`UPDATE users SET is_active = 0 WHERE id = ?`, [id]);
    return true;
  }
}

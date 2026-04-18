import { v4 as uuidv4 } from 'uuid';
import { ICommentRepository } from '../interfaces/ICommentRepository';
import { Comment, CreateCommentDTO, UpdateCommentDTO } from '../../core/models';
import { SqliteDriver } from './sqlite.driver';

function mapRow(row: Record<string, unknown>): Comment {
  const comment: Comment = {
    id: row['id'] as string,
    taskId: row['task_id'] as string,
    authorId: row['author_id'] as string,
    body: row['body'] as string,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };

  if (row['a_id']) {
    comment.author = {
      id: row['a_id'] as string,
      email: row['a_email'] as string,
      password: '',
      fullName: row['a_full_name'] as string,
      role: row['a_role'] as any,
      isActive: row['a_is_active'] === 1,
      createdAt: row['a_created_at'] as string,
      updatedAt: row['a_updated_at'] as string,
    };
  }

  return comment;
}

const SELECT_WITH_JOIN = `
  SELECT c.*,
    a.id as a_id, a.email as a_email, a.full_name as a_full_name,
    a.role as a_role, a.is_active as a_is_active,
    a.created_at as a_created_at, a.updated_at as a_updated_at
  FROM comments c
  LEFT JOIN users a ON a.id = c.author_id
`;

export class SqliteCommentRepository implements ICommentRepository {
  constructor(private driver: SqliteDriver) {}

  async findById(id: string): Promise<Comment | null> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} WHERE c.id = ?`, [id]
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async findAll(): Promise<Comment[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} ORDER BY c.created_at ASC`
    );
    return rows.map(mapRow);
  }

  async findByTask(taskId: string): Promise<Comment[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} WHERE c.task_id = ? ORDER BY c.created_at ASC`,
      [taskId]
    );
    return rows.map(mapRow);
  }

  async create(dto: CreateCommentDTO): Promise<Comment> {
    const now = new Date().toISOString();
    const id = dto.id || uuidv4();
    this.driver.run(
      `INSERT INTO comments (id, task_id, author_id, body, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, dto.taskId, dto.authorId, dto.body, now, now]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, dto: UpdateCommentDTO): Promise<Comment | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();
    this.driver.run(
      `UPDATE comments SET body = ?, updated_at = ? WHERE id = ?`,
      [dto.body ?? current.body, now, id]
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const current = await this.findById(id);
    if (!current) return false;
    this.driver.run(`DELETE FROM comments WHERE id = ?`, [id]);
    return true;
  }
}

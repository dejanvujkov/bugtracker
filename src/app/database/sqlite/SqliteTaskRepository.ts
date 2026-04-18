import { v4 as uuidv4 } from 'uuid';
import { ITaskRepository } from '../interfaces/ITaskRepository';
import { Task, CreateTaskDTO, UpdateTaskDTO, TaskStatus } from '../../core/models';
import { SqliteDriver } from './sqlite.driver';

function mapRow(row: Record<string, unknown>): Task {
  const task: Task = {
    id: row['id'] as string,
    projectId: row['project_id'] as string,
    epicId: row['epic_id'] as string | null,
    title: row['title'] as string,
    description: row['description'] as string | null,
    status: row['status'] as TaskStatus,
    isEpic: row['is_epic'] === 1,
    assigneeId: row['assignee_id'] as string | null,
    position: row['position'] as number,
    createdBy: row['created_by'] as string,
    createdAt: row['created_at'] as string,
    updatedAt: row['updated_at'] as string,
  };

  if (row['a_id']) {
    task.assignee = {
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

  if (row['e_title']) {
    task.epic = {
      id: row['epic_id'] as string,
      projectId: row['project_id'] as string,
      epicId: null,
      title: row['e_title'] as string,
      description: null,
      status: row['e_status'] as TaskStatus,
      isEpic: true,
      assigneeId: null,
      position: 0,
      createdBy: row['created_by'] as string,
      createdAt: '',
      updatedAt: '',
    };
  }

  if (row['child_count'] !== undefined) {
    task.childCount = row['child_count'] as number;
    task.closedChildCount = row['closed_child_count'] as number;
  }

  return task;
}

const SELECT_WITH_JOIN = `
  SELECT t.*,
    a.id as a_id, a.email as a_email, a.full_name as a_full_name,
    a.role as a_role, a.is_active as a_is_active,
    a.created_at as a_created_at, a.updated_at as a_updated_at,
    e.title as e_title, e.status as e_status,
    (SELECT COUNT(*) FROM tasks c WHERE c.epic_id = t.id) as child_count,
    (SELECT COUNT(*) FROM tasks c WHERE c.epic_id = t.id AND c.status = 'closed') as closed_child_count
  FROM tasks t
  LEFT JOIN users a ON a.id = t.assignee_id
  LEFT JOIN tasks e ON e.id = t.epic_id
`;

export class SqliteTaskRepository implements ITaskRepository {
  constructor(private driver: SqliteDriver) {}

  async findById(id: string): Promise<Task | null> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} WHERE t.id = ?`, [id]
    );
    return rows.length ? mapRow(rows[0]) : null;
  }

  async findAll(): Promise<Task[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} ORDER BY t.position ASC`
    );
    return rows.map(mapRow);
  }

  async findByProject(projectId: string, status?: TaskStatus): Promise<Task[]> {
    const sql = status
      ? `${SELECT_WITH_JOIN} WHERE t.project_id = ? AND t.status = ? ORDER BY t.position ASC`
      : `${SELECT_WITH_JOIN} WHERE t.project_id = ? ORDER BY t.position ASC`;
    const params: (string | null)[] = status ? [projectId, status] : [projectId];
    const rows = this.driver.query<Record<string, unknown>>(sql, params);
    return rows.map(mapRow);
  }

  async findByEpic(epicId: string): Promise<Task[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} WHERE t.epic_id = ? ORDER BY t.position ASC`, [epicId]
    );
    return rows.map(mapRow);
  }

  async findEpics(projectId: string): Promise<Task[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `${SELECT_WITH_JOIN} WHERE t.project_id = ? AND t.is_epic = 1 ORDER BY t.title ASC`,
      [projectId]
    );
    return rows.map(mapRow);
  }

  async getBoardData(projectId: string, epicId?: string): Promise<{ open: Task[]; active: Task[]; closed: Task[] }> {
    let sql: string;
    let params: (string | null)[];

    if (epicId) {
      sql = `${SELECT_WITH_JOIN} WHERE t.project_id = ? AND t.epic_id = ? ORDER BY t.position ASC`;
      params = [projectId, epicId];
    } else {
      sql = `${SELECT_WITH_JOIN} WHERE t.project_id = ? ORDER BY t.position ASC`;
      params = [projectId];
    }

    const rows = this.driver.query<Record<string, unknown>>(sql, params);
    const tasks = rows.map(mapRow);

    return {
      open: tasks.filter(t => t.status === 'open'),
      active: tasks.filter(t => t.status === 'active'),
      closed: tasks.filter(t => t.status === 'closed'),
    };
  }

  async updateStatus(id: string, status: TaskStatus): Promise<Task | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();
    this.driver.run(
      `UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, id]
    );
    return this.findById(id);
  }

  async reorderColumn(projectId: string, status: TaskStatus, orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, index) => {
      this.driver.run(
        `UPDATE tasks SET position = ?, updated_at = ? WHERE id = ? AND project_id = ? AND status = ?`,
        [index, new Date().toISOString(), id, projectId, status]
      );
    });
  }

  async allChildrenClosed(epicId: string): Promise<boolean> {
    const rows = this.driver.query<{ total: number; closed: number }>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
       FROM tasks WHERE epic_id = ?`,
      [epicId]
    );
    if (!rows.length) return true;
    const { total, closed } = rows[0];
    return total > 0 && total === closed;
  }

  async create(dto: CreateTaskDTO): Promise<Task> {
    const now = new Date().toISOString();
    const id = dto.id || uuidv4();

    // Get max position in column
    const posRows = this.driver.query<{ max_pos: number }>(
      `SELECT MAX(position) as max_pos FROM tasks WHERE project_id = ? AND status = ?`,
      [dto.projectId, dto.status || 'open']
    );
    const position = dto.position ?? ((posRows[0]?.max_pos ?? -1) + 1);

    this.driver.run(
      `INSERT INTO tasks (id, project_id, epic_id, title, description, status, is_epic, assignee_id, position, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        dto.projectId,
        dto.epicId ?? null,
        dto.title,
        dto.description ?? null,
        dto.status || 'open',
        dto.isEpic ? 1 : 0,
        dto.assigneeId ?? null,
        position,
        dto.createdBy,
        now,
        now,
      ]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, dto: UpdateTaskDTO): Promise<Task | null> {
    const current = await this.findById(id);
    if (!current) return null;
    const now = new Date().toISOString();
    this.driver.run(
      `UPDATE tasks SET
         epic_id = ?, title = ?, description = ?, status = ?,
         assignee_id = ?, position = ?, updated_at = ?
       WHERE id = ?`,
      [
        dto.epicId !== undefined ? dto.epicId : current.epicId,
        dto.title ?? current.title,
        dto.description !== undefined ? dto.description : current.description,
        dto.status ?? current.status,
        dto.assigneeId !== undefined ? dto.assigneeId : current.assigneeId,
        dto.position ?? current.position,
        now,
        id,
      ]
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const current = await this.findById(id);
    if (!current) return false;
    this.driver.run(`DELETE FROM tasks WHERE id = ?`, [id]);
    return true;
  }
}

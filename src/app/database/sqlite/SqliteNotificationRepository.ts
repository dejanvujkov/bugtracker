import { INotificationRepository } from '../interfaces/INotificationRepository';
import { AppNotification, CreateNotificationDTO, NotificationType, NotificationCategory } from '../../core/models';
import { SqliteDriver } from './sqlite.driver';

function mapRow(row: Record<string, unknown>): AppNotification {
  return {
    id: row['id'] as string,
    userId: row['user_id'] as string,
    type: row['type'] as NotificationType,
    category: row['category'] as NotificationCategory,
    message: row['message'] as string,
    isRead: row['is_read'] === 1,
    createdAt: row['created_at'] as string,
  };
}

export class SqliteNotificationRepository implements INotificationRepository {
  constructor(private driver: SqliteDriver) {}

  async findByUser(userId: string, limit = 50): Promise<AppNotification[]> {
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows.map(mapRow);
  }

  async create(dto: CreateNotificationDTO): Promise<AppNotification> {
    const now = new Date().toISOString();
    await this.driver.run(
      `INSERT INTO notifications (id, user_id, type, category, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [dto.id, dto.userId, dto.type, dto.category, dto.message, now]
    );
    const rows = this.driver.query<Record<string, unknown>>(
      `SELECT * FROM notifications WHERE id = ?`, [dto.id]
    );
    return mapRow(rows[0]);
  }

  async markRead(id: string): Promise<void> {
    await this.driver.run(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
  }

  async markAllRead(userId: string): Promise<void> {
    await this.driver.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
  }

  async deleteAll(userId: string): Promise<void> {
    await this.driver.run(`DELETE FROM notifications WHERE user_id = ?`, [userId]);
  }
}

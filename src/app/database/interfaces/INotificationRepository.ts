import { AppNotification, CreateNotificationDTO } from '../../core/models';

export interface INotificationRepository {
  findByUser(userId: string, limit?: number): Promise<AppNotification[]>;
  create(dto: CreateNotificationDTO): Promise<AppNotification>;
  markRead(id: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  deleteAll(userId: string): Promise<void>;
}

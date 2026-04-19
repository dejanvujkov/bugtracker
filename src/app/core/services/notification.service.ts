import { inject, Injectable, signal, computed } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { REPOS } from '../../database/repository-factory';
import { AppNotification, NotificationType, NotificationCategory } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private repos = inject(REPOS);

  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  /** Live queue — only populated by add(), never by loadForUser(). Used by the toast UI. */
  readonly toastQueue = signal<AppNotification[]>([]);

  async loadForUser(userId: string): Promise<void> {
    const all = await this.repos.notifications.findByUser(userId);
    this.notifications.set(all);
  }

  /** Fire-and-forget — never throws, never blocks the calling operation. */
  add(userId: string, type: NotificationType, category: NotificationCategory, message: string): void {
    if (!userId) return;
    this.repos.notifications
      .create({ id: uuidv4(), userId, type, category, message })
      .then(n => {
        this.notifications.update(list => [n, ...list].slice(0, 50));
        this.toastQueue.update(q => [...q, n]);
      })
      .catch(() => { /* notifications are best-effort */ });
  }

  dismissToast(id: string): void {
    this.toastQueue.update(q => q.filter(n => n.id !== id));
  }

  async markRead(notification: AppNotification): Promise<void> {
    if (notification.isRead) return;
    await this.repos.notifications.markRead(notification.id);
    this.notifications.update(list =>
      list.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
    );
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repos.notifications.markAllRead(userId);
    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
  }

  async clearAll(userId: string): Promise<void> {
    await this.repos.notifications.deleteAll(userId);
    this.notifications.set([]);
  }

  /** Called on logout — wipes the in-memory state only. */
  clear(): void {
    this.notifications.set([]);
  }
}

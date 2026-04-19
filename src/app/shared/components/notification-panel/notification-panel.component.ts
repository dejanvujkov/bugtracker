import { Component, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotification } from '../../../core/models';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Backdrop to close on outside click -->
    <div class="backdrop" (click)="closed.emit()"></div>

    <div class="panel">
      <div class="panel-header">
        <div class="header-left">
          <span class="panel-title">Notifications</span>
          @if (notificationSvc.unreadCount() > 0) {
            <span class="unread-chip">{{ notificationSvc.unreadCount() }} unread</span>
          }
        </div>
        <div class="header-actions">
          @if (notificationSvc.unreadCount() > 0) {
            <button mat-icon-button matTooltip="Mark all as read" (click)="markAllRead()">
              <mat-icon>done_all</mat-icon>
            </button>
          }
          <button mat-icon-button matTooltip="Clear all" (click)="clearAll()"
                  [disabled]="notificationSvc.notifications().length === 0">
            <mat-icon>delete_sweep</mat-icon>
          </button>
          <button mat-icon-button matTooltip="Close" (click)="closed.emit()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <div class="panel-body">
        @if (notificationSvc.notifications().length === 0) {
          <div class="empty-state">
            <mat-icon>notifications_none</mat-icon>
            <p>No notifications yet</p>
          </div>
        } @else {
          @for (n of notificationSvc.notifications(); track n.id) {
            <div class="notification-item" [class.unread]="!n.isRead" (click)="markRead(n)">
              <div class="item-stripe" [style.background]="typeColor(n.type)"></div>
              <mat-icon class="item-icon" [style.color]="typeColor(n.type)">{{ typeIcon(n.type) }}</mat-icon>
              <div class="item-body">
                <div class="item-message">{{ n.message }}</div>
                <div class="item-meta">
                  <span class="item-category">{{ n.category }}</span>
                  <span class="item-dot">·</span>
                  <span class="item-time">{{ relativeTime(n.createdAt) }}</span>
                </div>
              </div>
              @if (!n.isRead) {
                <div class="unread-dot"></div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 199;
    }

    .panel {
      position: fixed;
      left: 248px;
      bottom: 8px;
      width: 360px;
      max-height: 520px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 200;
      border: 1px solid rgba(0,0,0,0.08);
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 8px 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-title {
      font-size: 15px;
      font-weight: 700;
      color: #1b1a19;
    }

    .unread-chip {
      background: #0078d4;
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .header-actions button {
      color: #605e5c;
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .header-actions mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .panel-body {
      overflow-y: auto;
      flex: 1;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      color: #a19f9d;
      gap: 8px;
    }

    .empty-state mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px 12px 0;
      cursor: pointer;
      transition: background 0.12s;
      position: relative;
      border-bottom: 1px solid #f5f5f5;
    }

    .notification-item:last-child { border-bottom: none; }

    .notification-item:hover { background: #f8f8f8; }

    .notification-item.unread { background: #f0f6ff; }

    .notification-item.unread:hover { background: #e8f0fd; }

    .item-stripe {
      width: 3px;
      align-self: stretch;
      border-radius: 0 2px 2px 0;
      flex-shrink: 0;
    }

    .item-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-top: 1px;
      flex-shrink: 0;
    }

    .item-body {
      flex: 1;
      min-width: 0;
    }

    .item-message {
      font-size: 13px;
      color: #1b1a19;
      line-height: 1.4;
      word-break: break-word;
    }

    .notification-item.unread .item-message { font-weight: 600; }

    .item-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-top: 3px;
    }

    .item-category {
      font-size: 11px;
      color: #a19f9d;
      text-transform: capitalize;
    }

    .item-dot { font-size: 11px; color: #c8c6c4; }

    .item-time {
      font-size: 11px;
      color: #a19f9d;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0078d4;
      flex-shrink: 0;
      margin-top: 4px;
    }
  `]
})
export class NotificationPanelComponent {
  @Output() closed = new EventEmitter<void>();

  notificationSvc = inject(NotificationService);
  private auth = inject(AuthService);

  typeIcon(type: string): string {
    if (type === 'success') return 'check_circle';
    if (type === 'error') return 'error';
    return 'info';
  }

  typeColor(type: string): string {
    if (type === 'success') return '#107c10';
    if (type === 'error') return '#d83b01';
    return '#0078d4';
  }

  relativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  async markRead(n: AppNotification): Promise<void> {
    await this.notificationSvc.markRead(n);
  }

  async markAllRead(): Promise<void> {
    const uid = this.auth.currentUser()?.id;
    if (uid) await this.notificationSvc.markAllRead(uid);
  }

  async clearAll(): Promise<void> {
    const uid = this.auth.currentUser()?.id;
    if (uid) await this.notificationSvc.clearAll(uid);
  }
}

import {
  Component, Input, Output, EventEmitter,
  OnInit, OnDestroy, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AppNotification } from '../../../core/models';

const DISMISS_DELAY_MS = 5000;
const LEAVE_ANIM_MS   = 320;

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast"
         [class.toast--success]="notification.type === 'success'"
         [class.toast--error]="notification.type === 'error'"
         [class.toast--info]="notification.type === 'info'"
         [class.toast--leaving]="leaving()"
         (mouseenter)="onEnter()"
         (mouseleave)="onLeave()">

      <!-- X button: top-left, visible only on hover -->
      @if (hovered()) {
        <button class="close-btn" (click)="onClose($event)" aria-label="Dismiss">
          <mat-icon>close</mat-icon>
        </button>
      }

      <div class="toast-stripe"></div>

      <mat-icon class="toast-icon">{{ icon() }}</mat-icon>

      <div class="toast-body">
        <span class="toast-message">{{ notification.message }}</span>
        <span class="toast-meta">{{ notification.category }}</span>
      </div>

      <!-- Progress bar: visible only when NOT hovered and NOT leaving -->
      @if (!hovered() && !leaving()) {
        <div class="toast-progress"></div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── card ── */
    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 340px;
      padding: 14px 16px 14px 0;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10);
      overflow: hidden;
      animation: slideIn .25s cubic-bezier(.4,0,.2,1) both;
      transition: transform ${LEAVE_ANIM_MS}ms cubic-bezier(.4,0,.2,1),
                  opacity  ${LEAVE_ANIM_MS}ms ease;
    }

    .toast--leaving {
      transform: translateX(calc(100% + 24px));
      opacity: 0;
    }

    @keyframes slideIn {
      from { transform: translateX(calc(100% + 24px)); opacity: 0; }
      to   { transform: translateX(0);                 opacity: 1; }
    }

    /* ── colored stripe ── */
    .toast-stripe {
      width: 4px;
      align-self: stretch;
      flex-shrink: 0;
      border-radius: 0 2px 2px 0;
    }
    .toast--success .toast-stripe { background: #107c10; }
    .toast--error   .toast-stripe { background: #d83b01; }
    .toast--info    .toast-stripe { background: #0078d4; }

    /* ── icon ── */
    .toast-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
    .toast--success .toast-icon { color: #107c10; }
    .toast--error   .toast-icon { color: #d83b01; }
    .toast--info    .toast-icon { color: #0078d4; }

    /* ── body ── */
    .toast-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .toast-message {
      font-size: 13px;
      font-weight: 600;
      color: #1b1a19;
      line-height: 1.4;
      word-break: break-word;
    }
    .toast-meta {
      font-size: 11px;
      color: #a19f9d;
      text-transform: capitalize;
    }

    /* ── progress bar ── */
    .toast-progress {
      position: absolute;
      bottom: 0; left: 0;
      height: 3px;
      width: 100%;
      transform-origin: left;
      animation: shrink ${DISMISS_DELAY_MS}ms linear forwards;
    }
    .toast--success .toast-progress { background: #107c10; opacity: .4; }
    .toast--error   .toast-progress { background: #d83b01; opacity: .4; }
    .toast--info    .toast-progress { background: #0078d4; opacity: .4; }

    @keyframes shrink {
      from { transform: scaleX(1); }
      to   { transform: scaleX(0); }
    }

    /* ── close button ── */
    .close-btn {
      position: absolute;
      top: 8px;
      left: 8px;
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 50%;
      background: rgba(0,0,0,0.12);
      color: #3b3a39;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background .15s;
      z-index: 1;
    }
    .close-btn:hover { background: rgba(0,0,0,0.22); }
    .close-btn mat-icon {
      font-size: 13px;
      width: 13px;
      height: 13px;
      line-height: 13px;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  @Input({ required: true }) notification!: AppNotification;
  @Output() dismissed = new EventEmitter<string>();

  protected hovered = signal(false);
  protected leaving = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.timer = setTimeout(() => this.dismiss(), DISMISS_DELAY_MS);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected icon(): string {
    if (this.notification.type === 'success') return 'check_circle';
    if (this.notification.type === 'error')   return 'error';
    return 'info';
  }

  protected onEnter(): void {
    this.hovered.set(true);
    this.clearTimer();
  }

  protected onLeave(): void {
    this.hovered.set(false);
    this.dismiss();
  }

  protected onClose(e: MouseEvent): void {
    e.stopPropagation();
    this.dismiss();
  }

  private dismiss(): void {
    if (this.leaving()) return;
    this.leaving.set(true);
    this.clearTimer();
    setTimeout(() => this.dismissed.emit(this.notification.id), LEAVE_ANIM_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [ToastComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (toast of notificationSvc.toastQueue(); track toast.id) {
      <app-toast [notification]="toast" (dismissed)="notificationSvc.dismissToast($event)">
      </app-toast>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      /* Let clicks pass through the gap between toasts */
      pointer-events: none;
    }
    app-toast {
      pointer-events: auto;
    }
  `]
})
export class ToastContainerComponent {
  notificationSvc = inject(NotificationService);
}

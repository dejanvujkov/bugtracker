import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskStatus } from '../../../core/models';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge--' + status">{{ label }}</span>`,
  styles: [`
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge--open { background: #e6f3fb; color: #0078d4; }
    .badge--active { background: #dff6dd; color: #107c10; }
    .badge--closed { background: #f0efed; color: #605e5c; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: TaskStatus = 'open';
  get label(): string {
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }
}

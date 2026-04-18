import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../../core/models';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avatar" [style.background]="color" [style.width.px]="size" [style.height.px]="size" [title]="user?.fullName || ''">
      <span [style.font-size.px]="size * 0.38">{{ initials }}</span>
    </div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      flex-shrink: 0;
      user-select: none;
    }
  `]
})
export class AvatarComponent {
  @Input() user: Pick<User, 'fullName'> | null = null;
  @Input() size = 32;

  get initials(): string {
    if (!this.user?.fullName) return '?';
    return this.user.fullName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  get color(): string {
    const colors = ['#0078d4','#107c10','#8764b8','#d83b01','#00b4d2','#038387','#ca5010'];
    if (!this.user?.fullName) return '#605e5c';
    const idx = this.user.fullName.charCodeAt(0) % colors.length;
    return colors[idx];
  }
}

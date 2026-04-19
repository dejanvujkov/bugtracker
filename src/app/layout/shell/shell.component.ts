import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ToastContainerComponent } from '../../shared/components/toast/toast-container.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, SidebarComponent, ToastContainerComponent],
  template: `
    <app-sidebar></app-sidebar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
    <app-toast-container></app-toast-container>
  `,
  styles: [`
    :host { display: flex; min-height: 100vh; }
    .main-content {
      margin-left: 240px;
      flex: 1;
      min-height: 100vh;
      background: var(--color-bg-app);
      overflow: auto;
    }
  `]
})
export class ShellComponent {}

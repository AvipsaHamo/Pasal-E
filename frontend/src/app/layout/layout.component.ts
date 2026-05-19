import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <div class="app-shell">
      <app-navbar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: #708848;
    }

    .main-content {
      flex: 1;
      height: 100vh;
      overflow-y: auto;
      background: #f0f4dc;
      border-radius: 40px 0 0 40px;
    }

    @media (max-width: 768px) {
      .app-shell {
        flex-direction: column;
        background: #f0f4dc;
      }

      .main-content {
        height: 100vh;
        border-radius: 0;
        overflow-y: auto;
        padding-bottom: 72px;
      }
    }
  `]
})
export class LayoutComponent {}
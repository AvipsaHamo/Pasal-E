// src/app/dashboard/dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;background:var(--cream);display:flex;align-items:center;
                justify-content:center;flex-direction:column;gap:24px;font-family:'Nunito',sans-serif;">
      <div style="font-size:48px;font-weight:900;color:var(--olive-dark)">Pasal-E</div>
      <div style="font-size:18px;color:var(--text-muted)">
        Welcome, {{ auth.owner()?.firstName }}! 🎉
      </div>
      <p style="color:var(--text-muted);font-size:14px">Dashboard coming soon.</p>
      <button (click)="auth.logout()"
        style="padding:12px 32px;background:var(--black);color:#fff;border:none;border-radius:10px;
               font-family:'Nunito',sans-serif;font-size:15px;font-weight:700;cursor:pointer;">
        Logout
      </button>
    </div>
  `
})
export class DashboardComponent {
  constructor(public auth: AuthService) {}
}

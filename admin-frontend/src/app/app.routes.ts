// admin-frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { adminGuard, adminGuestGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/admin-login.component').then(m => m.AdminLoginComponent),
    canActivate: [adminGuestGuard]
  },
  {
    path: 'shops',
    loadComponent: () =>
      import('./admin/shops/shops.component').then(m => m.ShopsComponent),
    canActivate: [adminGuard]
  },
  { path: '**', redirectTo: 'login' }
];

import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'signup',
    loadComponent: () => import('./auth/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'setup-shop',
    loadComponent: () => import('./auth/after-signup/after-signup.component').then(m => m.AfterSignupComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'inventory', loadComponent: () => import('./inventory/inventory.component').then(m => m.InventoryComponent) },
      { path: 'orders',    loadComponent: () => import('./orders/orders.component').then(m => m.OrdersComponent) },
      { path: 'foresight', loadComponent: () => import('./foresight/foresight.component').then(m => m.ForesightComponent) },
      { path: 'your-shop', loadComponent: () => import('./your-shop/your-shop.component').then(m => m.YourShopComponent) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];

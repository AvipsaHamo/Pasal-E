import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./shop/home/home.component').then(m => m.HomeComponent) },
  { path: 'categories', loadComponent: () => import('./shop/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'cart', loadComponent: () => import('./shop/cart/cart.component').then(m => m.CartComponent) },
  { path: 'profile', loadComponent: () => import('./shop/profile/profile.component').then(m => m.ProfileComponent) },
  { path: '**', redirectTo: '' }
];

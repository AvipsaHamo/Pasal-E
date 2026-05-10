import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shop/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./shop/categories/categories.component').then(m => m.CategoriesComponent)
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./shop/products/products.component').then(m => m.ProductsComponent)
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./shop/cart/cart.component').then(m => m.CartComponent)
  },
  { path: '**', redirectTo: '' }
];

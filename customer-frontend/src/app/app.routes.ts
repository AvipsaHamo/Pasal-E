import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./shop/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'categories/:id',
    loadComponent: () =>
      import('./shop/category/category.component').then(m => m.CategoryComponent)
  },
  {
    path: 'categories',
    pathMatch: 'full',
    loadComponent: () =>
      import('./shop/categories/categories.component').then(m => m.CategoriesComponent)
  },
  {
    path: 'products',
    pathMatch: 'full',
    loadComponent: () =>
      import('./shop/products/products.component').then(m => m.ProductsComponent)
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./shop/product-detail/product-detail.component').then(m => m.ProductDetailComponent)
  },
  {
    path: 'cart',
    pathMatch: 'full',
    loadComponent: () =>
      import('./cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    pathMatch: 'full',
    loadComponent: () =>
      import('./checkout/checkout.component').then(m => m.CheckoutComponent)
  },
  { path: '**', redirectTo: '' }
];

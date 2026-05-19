import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { CustomerShopService, StorefrontProduct } from '../../core/services/shop.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="page-container">
    <!-- Header with search + sort -->
    <div class="page-header">
      <h1 class="page-title">All Products</h1>
      <div class="controls">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Search products..." [(ngModel)]="search" (ngModelChange)="onSearchChange()" />
        </div>
        <select class="sort-select" [(ngModel)]="sort" (ngModelChange)="onSortChange()">
          @for (opt of sortOptions; track opt.value) {
            <option [value]="opt.value">{{ opt.label }}</option>
          }
        </select>
      </div>
    </div>

    @if (loading) {
      <div class="products-grid">
        @for (_ of [1,2,3,4,5,6]; track $index) {
          <div class="product-card skeleton-card">
            <div class="skeleton-img"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        }
      </div>
    } @else if (error) {
      <div class="state-msg error">{{ error }}</div>
    } @else if (products.length === 0) {
      <div class="state-msg">No products found.</div>
    } @else {
      <div class="products-grid">
        @for (p of products; track p.productId) {
          <div class="product-card">
            <a [routerLink]="['/products', p.productId]" class="product-img-link">
              <div class="product-img-wrap">
                @if (p.image) {
                  <img [src]="p.image" [alt]="p.name" class="product-img" />
                } @else {
                  <div class="product-img-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                }
              </div>
            </a>
            <div class="product-info">
              <div class="product-meta">
                <div>
                  <p class="product-name">{{ p.name }}</p>
                  <p class="product-price">Price: {{ formatPrice(p.sellingPrice) }}</p>
                </div>
                <button class="cart-btn" (click)="addToCart(p)" [disabled]="p.stock === 0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  </div>
  `,
  styles: [
`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.page-container { padding:40px 60px; background:var(--c-bg-page,#f2f8f0); min-height:100vh; font-family:'Poppins',sans-serif; }

.page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:32px; }
.page-title { font-size:26px; font-weight:700; color:var(--c-text-secondary,#4a7c3f); }

.controls { display:flex; align-items:center; gap:12px; }

.search-wrap { position:relative; display:flex; align-items:center; }
.search-wrap svg { position:absolute; left:12px; width:17px; height:17px; stroke:#999; pointer-events:none; }
.search-wrap input { width:240px; padding:10px 14px 10px 38px; background:var(--c-bg-card,#fff); border:1.5px solid var(--c-border,#e0e8c8); border-radius:24px; font-family:'Poppins',sans-serif; font-size:14px; color:var(--c-text-primary,#111); outline:none; transition:border-color 0.2s; }
.search-wrap input:focus { border-color:var(--c-primary,#4a7c3f); }
.search-wrap input::placeholder { color:#b0b8a0; }

.sort-select { padding:10px 14px; background:var(--c-bg-card,#fff); border:1.5px solid var(--c-border,#e0e8c8); border-radius:10px; font-family:'Poppins',sans-serif; font-size:14px; font-weight:500; color:var(--c-text-primary,#111); outline:none; cursor:pointer; }
.sort-select:focus { border-color:var(--c-primary,#4a7c3f); }

.products-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:28px; }
@media(max-width:900px){ .products-grid{grid-template-columns:repeat(2,1fr);} .page-container{padding:24px 20px;} }
@media(max-width:540px){ .products-grid{grid-template-columns:1fr;} }

.product-card { background:var(--c-bg-card,#fff); border-radius:16px; overflow:hidden; border:1px solid var(--c-border,#e5e7eb); transition:box-shadow 0.2s,transform 0.2s; }
.product-card:hover { box-shadow:0 8px 32px rgba(0,0,0,.10); transform:translateY(-2px); }
.product-img-link { display:block; text-decoration:none; }
.product-img-wrap { width:100%; aspect-ratio:4/3; overflow:hidden; background:var(--c-primary-muted,#f3f4f6); }
.product-img { width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.3s; }
.product-card:hover .product-img { transform:scale(1.03); }
.product-img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.product-img-placeholder svg { width:48px; height:48px; stroke:var(--c-primary,#4a7c3f); opacity:0.4; }
.product-info { padding:14px 18px 16px; }
.product-meta { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
.product-name { font-size:15px; font-weight:600; color:var(--c-text-primary,#111); margin-bottom:3px; }
.product-price { font-size:14px; font-weight:500; color:var(--c-text-secondary,#4a7c3f); }
.cart-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:8px; color:var(--c-text-primary,#111); flex-shrink:0; transition:background 0.15s; display:flex; align-items:center; }
.cart-btn:hover:not(:disabled) { background:var(--c-primary-muted,#f0f4f0); }
.cart-btn:disabled { opacity:0.35; cursor:not-allowed; }
.cart-btn svg { width:22px; height:22px; }

.skeleton-card { pointer-events:none; }
.skeleton-img { aspect-ratio:4/3; background:linear-gradient(90deg,var(--c-primary-light,#e0e0e0) 25%,var(--c-primary-muted,#f0f0f0) 50%,var(--c-primary-light,#e0e0e0) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
.skeleton-text { height:13px; margin:14px 18px 6px; border-radius:4px; background:linear-gradient(90deg,var(--c-primary-light,#e0e0e0) 25%,var(--c-primary-muted,#f0f0f0) 50%,var(--c-primary-light,#e0e0e0) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
.skeleton-text.short { width:55%; margin-top:0; margin-bottom:18px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.state-msg { text-align:center; padding:60px; font-size:15px; font-weight:500; color:var(--c-text-secondary,#4a7c3f); }
.state-msg.error { color:#c0392b; }
`
  ]
})
export class ProductsComponent implements OnInit, OnDestroy {
  products: StorefrontProduct[] = [];
  loading  = true;
  error    = '';
  search   = '';
  sort     = 'recent';
  private searchSubject = new Subject<string>();
  private destroy$      = new Subject<void>();

  readonly sortOptions = [
    { value: 'recent',     label: 'Recently Added' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'price_asc',  label: 'Price: Low to High' }
  ];

  constructor(public shopSvc: CustomerShopService, public cartSvc: CartService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.searchSubject.pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.loadProducts());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadProducts(): void {
    this.loading = true; this.error = '';
    const sortParam = this.sort === 'recent' ? undefined : this.sort;
    this.shopSvc.getProducts(undefined, this.search || undefined, sortParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  p => { this.products = p; this.loading = false; },
        error: (err: { error?: { message?: string } }) => {
          this.loading = false; this.error = err?.error?.message ?? 'Failed to load products.';
        }
      });
  }

  onSearchChange(): void { this.searchSubject.next(this.search); }
  onSortChange():   void { this.loadProducts(); }

  addToCart(p: StorefrontProduct): void {
    this.cartSvc.addItem({ productId: p.productId, name: p.name, image: p.image, price: p.sellingPrice ?? 0 });
  }

  formatPrice(n?: number): string { return n != null ? `Rs. ${n.toLocaleString()}` : '—'; }
}

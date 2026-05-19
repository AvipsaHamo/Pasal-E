import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { CustomerShopService, StorefrontProduct, StorefrontCategory } from '../../core/services/shop.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="page-container">
    <!-- Back + title -->
    <div class="page-header">
      <a class="back-btn" routerLink="/categories">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"/>
          <polyline points="12 19 5 12 12 5"/>
        </svg>
      </a>
      <h1 class="page-title">{{ category?.name ?? 'Category' }}</h1>
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
      <div class="state-msg">No products in this category yet.</div>
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
                <button class="cart-btn" (click)="addToCart(p)"
                  [disabled]="p.stock === 0" title="Add to cart">
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

.page-container { padding: 40px 60px; background: var(--c-bg-page,#f2f8f0); min-height:100vh; font-family:'Poppins',sans-serif; }

.page-header { display:flex; align-items:center; gap:14px; margin-bottom:32px; }
.back-btn { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:50%; background:transparent; border:none; cursor:pointer; transition:background 0.18s; text-decoration:none; }
.back-btn:hover { background:var(--c-primary-muted,#e8f3e6); }
.back-btn svg { width:22px; height:22px; stroke:var(--c-text-primary,#1a2e18); }
.page-title { font-size:26px; font-weight:700; color:var(--c-text-secondary,#4a7c3f); letter-spacing:-0.3px; }

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
`]
})
export class CategoryComponent implements OnInit, OnDestroy {
  products:   StorefrontProduct[]  = [];
  category:   StorefrontCategory | null = null;
  loading     = true;
  error       = '';
  categoryId  = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private route:   ActivatedRoute,
    public  shopSvc: CustomerShopService,
    public  cartSvc: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.categoryId = +params['id'];
      this.loadData();
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadData(): void {
    this.loading = true; this.error = '';
    // Load categories to get name, then load products
    this.shopSvc.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next: cats => {
        this.category = cats.find(c => c.categoryId === this.categoryId) ?? null;
        this.shopSvc.getProducts(this.categoryId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next:  p => { this.products = p; this.loading = false; },
            error: (err: { error?: { message?: string } }) => {
              this.loading = false; this.error = err?.error?.message ?? 'Failed to load products.';
            }
          });
      }
    });
  }

  addToCart(p: StorefrontProduct): void {
    const price = p.sellingPrice ?? 0;
    this.cartSvc.addItem({
      productId: p.productId, name: p.name, image: p.image, price
    });
  }

  formatPrice(n?: number): string {
    return n != null ? `Rs. ${n.toLocaleString()}` : '—';
  }
}

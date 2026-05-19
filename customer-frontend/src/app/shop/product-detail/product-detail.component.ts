import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerShopService, StorefrontProduct, StorefrontVariation } from '../../core/services/shop.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="page-container">
    <!-- Back -->
    <a class="back-btn" (click)="goBack()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
      </svg>
    </a>

    @if (loading) {
      <div class="detail-skeleton">
        <div class="skeleton-main-img"></div>
        <div class="skeleton-info">
          <div class="sk-line tall"></div>
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
          <div class="sk-line btn"></div>
        </div>
      </div>
    } @else if (error) {
      <div class="state-msg error">{{ error }}</div>
    } @else if (product) {
      <div class="detail-layout">

        <!-- Left: images -->
        <div class="images-col">
          <!-- Main image -->
          <div class="main-img-wrap">
            @if (activeImage) {
              <img [src]="activeImage" [alt]="product.name" class="main-img" />
            } @else {
              <div class="main-img-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
            }
          </div>

          <!-- Thumbnail strip -->
          @if (allImages.length > 1) {
            <div class="thumb-strip">
              @for (img of allImages; track img; let i = $index) {
                <button class="thumb-btn" [class.active]="img === activeImage"
                  (click)="selectImage(img)">
                  <img [src]="img" [alt]="'Image ' + (i+1)" />
                </button>
              }
            </div>
          }
        </div>

        <!-- Right: info -->
        <div class="info-col">
          <h1 class="product-name">{{ product.name }}</h1>
          <p class="product-price">{{ formatPrice(currentPrice) }}</p>

          <!-- Variant label -->
          @if (selectedVariation) {
            <p class="variant-label">
              Variant: <span class="variant-value">{{ selectedVariation.name }}</span>
            </p>
          }

          <!-- Quantity controls -->
          <div class="qty-row">
            <button class="qty-btn" (click)="decrement()" [disabled]="quantity <= 1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span class="qty-display">{{ quantity }}</span>
            <button class="qty-btn" (click)="increment()" [disabled]="product.stock === 0 || quantity >= product.stock">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>

          <!-- Add to cart -->
          <button class="add-cart-btn" (click)="addToCart()"
            [disabled]="product.stock === 0"
            [class.added]="addedToCart">
            {{ addedToCart ? '✓ Added to Cart' : (product.stock === 0 ? 'Out of Stock' : 'Add To Cart') }}
          </button>

          <!-- Divider -->
          <div class="section-divider"></div>

          <!-- Description -->
          @if (product.description) {
            <div class="desc-section">
              <h3 class="desc-title">Product Description</h3>
              <p class="desc-text">{{ product.description }}</p>
            </div>
          }

          <!-- Variations -->
          @if (product.variations?.length) {
            <div class="variations-section">
              @for (v of product.variations; track v.variationId) {
                <button class="var-thumb-btn"
                  [class.active]="selectedVariation?.variationId === v.variationId"
                  (click)="selectVariation(v)"
                  [title]="v.name ?? ''">
                  @if (v.image) {
                    <img [src]="v.image" [alt]="v.name ?? ''" />
                  } @else {
                    <span class="var-name-badge">{{ v.name }}</span>
                  }
                </button>
              }
            </div>
          }
        </div>

      </div>
    }
  </div>
  `,
  styles: [
`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

.page-container { padding:32px 60px 60px; background:var(--c-bg-page,#f2f8f0); min-height:100vh; font-family:'Poppins',sans-serif; }

.back-btn { display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; background:none; border:none; cursor:pointer; border-radius:50%; transition:background 0.15s; text-decoration:none; margin-bottom:20px; }
.back-btn:hover { background:var(--c-primary-muted,#e8f3e6); }
.back-btn svg { width:22px; height:22px; stroke:var(--c-text-primary,#1a2e18); }

.detail-layout { display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:start; }
@media(max-width:768px){ .detail-layout{grid-template-columns:1fr; gap:32px;} .page-container{padding:20px;} }

.images-col { display:flex; flex-direction:column; gap:16px; }
.main-img-wrap { width:100%; aspect-ratio:3/4; overflow:hidden; border-radius:16px; background:var(--c-primary-muted,#f0f4f0); }
.main-img { width:100%; height:100%; object-fit:cover; border-radius:16px; }
.main-img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; }
.main-img-placeholder svg { width:64px; height:64px; stroke:var(--c-primary,#4a7c3f); opacity:0.3; }

.thumb-strip { display:flex; gap:10px; flex-wrap:wrap; }
.thumb-btn { width:72px; height:72px; border-radius:8px; overflow:hidden; border:2px solid transparent; background:var(--c-primary-muted,#f0f4f0); cursor:pointer; padding:0; transition:border-color 0.18s; }
.thumb-btn.active { border-color:var(--c-primary,#4a7c3f); }
.thumb-btn img { width:100%; height:100%; object-fit:cover; }

.info-col { display:flex; flex-direction:column; gap:0; }
.product-name { font-size:30px; font-weight:700; color:var(--c-text-secondary,#4a7c3f); margin-bottom:10px; letter-spacing:-0.3px; }
.product-price { font-size:20px; font-weight:700; color:var(--c-text-primary,#111); margin-bottom:8px; }
.variant-label { font-size:15px; font-weight:500; color:var(--c-text-secondary,#4a7c3f); margin-bottom:20px; }
.variant-value { color:var(--c-text-primary,#111); font-weight:600; }

.qty-row { display:flex; align-items:center; gap:0; margin-bottom:24px; width:fit-content; }
.qty-btn { width:52px; height:52px; background:var(--c-bg-card,#fff); border:1.5px solid var(--c-border,#d0d0d0); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
.qty-btn:first-child { border-radius:10px 0 0 10px; }
.qty-btn:last-child  { border-radius:0 10px 10px 0; }
.qty-btn:hover:not(:disabled) { background:var(--c-primary-muted,#f0f4f0); }
.qty-btn:disabled { opacity:0.4; cursor:not-allowed; }
.qty-btn svg { width:18px; height:18px; }
.qty-display { min-width:52px; height:52px; display:flex; align-items:center; justify-content:center; background:var(--c-bg-card,#fff); border-top:1.5px solid var(--c-border,#d0d0d0); border-bottom:1.5px solid var(--c-border,#d0d0d0); font-size:16px; font-weight:600; color:var(--c-text-primary,#111); }

.add-cart-btn { width:100%; max-width:400px; padding:17px 0; background:#111; color:#fff; border:none; border-radius:10px; font-family:'Poppins',sans-serif; font-size:16px; font-weight:600; cursor:pointer; transition:background 0.18s, transform 0.1s; margin-bottom:24px; }
.add-cart-btn:hover:not(:disabled) { background:#333; }
.add-cart-btn.added { background:var(--c-primary,#4a7c3f); }
.add-cart-btn:disabled { background:#999; cursor:not-allowed; }

.section-divider { height:1px; background:var(--c-border,#d0d0d0); margin:0 0 20px; }

.desc-title { font-size:17px; font-weight:700; color:var(--c-text-primary,#111); margin-bottom:10px; }
.desc-text  { font-size:14px; font-weight:400; color:var(--c-text-primary,#333); line-height:1.7; }

.variations-section { display:flex; flex-wrap:wrap; gap:10px; margin-top:16px; }
.var-thumb-btn { width:64px; height:64px; border-radius:8px; border:2.5px solid transparent; background:var(--c-primary-muted,#f0f4f0); cursor:pointer; padding:0; overflow:hidden; transition:border-color 0.18s; display:flex; align-items:center; justify-content:center; }
.var-thumb-btn.active { border-color:var(--c-primary,#4a7c3f); }
.var-thumb-btn img { width:100%; height:100%; object-fit:cover; }
.var-name-badge { font-size:11px; font-weight:600; color:var(--c-text-primary,#333); text-align:center; padding:4px; }

.detail-skeleton { display:grid; grid-template-columns:1fr 1fr; gap:60px; }
.skeleton-main-img { aspect-ratio:3/4; background:linear-gradient(90deg,var(--c-primary-light,#e0e0e0) 25%,var(--c-primary-muted,#f0f0f0) 50%,var(--c-primary-light,#e0e0e0) 75%); background-size:200% 100%; border-radius:16px; animation:shimmer 1.4s infinite; }
.skeleton-info { display:flex; flex-direction:column; gap:16px; padding-top:10px; }
.sk-line { border-radius:6px; background:linear-gradient(90deg,var(--c-primary-light,#e0e0e0) 25%,var(--c-primary-muted,#f0f0f0) 50%,var(--c-primary-light,#e0e0e0) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
.sk-line { height:16px; } .sk-line.tall { height:36px; } .sk-line.short { width:50%; } .sk-line.btn { height:52px; border-radius:10px; }
@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
.state-msg { text-align:center; padding:60px; font-size:15px; font-weight:500; color:var(--c-text-secondary,#4a7c3f); }
.state-msg.error { color:#c0392b; }
`]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product:          StorefrontProduct | null = null;
  loading           = true;
  error             = '';
  quantity          = 1;
  selectedVariation: StorefrontVariation | null = null;
  activeImage:      string | null = null;
  addedToCart       = false;
  private destroy$  = new Subject<void>();

  constructor(
    private route:   ActivatedRoute,
    public  shopSvc: CustomerShopService,
    public  cartSvc: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.loadProduct(+params['id']);
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadProduct(id: number): void {
    this.loading = true; this.error = '';
    this.shopSvc.getProduct(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: p => this.applyProduct(p),
      error: (err: any) => {
        // If backend returned 404 for single-product, try fetching product list and find it there
        if (err?.status === 404) {
          this.shopSvc.getProducts().pipe(takeUntil(this.destroy$)).subscribe({
            next: list => {
              const found = list.find((x: any) => x.productId === id);
              if (found) this.applyProduct(found);
              else { this.loading = false; this.error = 'Product not found.'; }
            },
            error: () => { this.loading = false; this.error = 'Failed to load product.'; }
          });
        } else {
          this.loading = false;
          this.error   = err?.error?.message ?? 'Failed to load product.';
        }
      }
    });
  }

  private applyProduct(p: StorefrontProduct): void {
    this.product = p;
    this.loading = false;
    this.activeImage = p.image ?? null;
    if (p.variations?.length) {
      this.selectedVariation = p.variations[0];
      if (p.variations[0].image) this.activeImage = p.variations[0].image;
    }
  }

  selectVariation(v: StorefrontVariation): void {
    this.selectedVariation = v;
    if (v.image) this.activeImage = v.image;
    else if (this.product?.image) this.activeImage = this.product.image;
  }

  selectImage(img: string): void { this.activeImage = img; }

  get currentPrice(): number {
    if (this.selectedVariation?.sellingPrice != null) return this.selectedVariation.sellingPrice;
    return this.product?.sellingPrice ?? 0;
  }

  get allImages(): string[] {
    const imgs: string[] = [];
    if (this.product?.image) imgs.push(this.product.image);
    this.product?.variations?.forEach(v => { if (v.image && !imgs.includes(v.image)) imgs.push(v.image); });
    return imgs;
  }

  increment(): void { if (this.product && this.quantity < this.product.stock) this.quantity++; }
  decrement(): void { if (this.quantity > 1) this.quantity--; }

  addToCart(): void {
    if (!this.product) return;
    this.cartSvc.addItem({
      productId:     this.product.productId,
      name:          this.product.name,
      image:         this.activeImage ?? this.product.image,
      price:         this.currentPrice,
      variationId:   this.selectedVariation?.variationId,
      variationName: this.selectedVariation?.name ?? undefined
    }, this.quantity);
    this.addedToCart = true;
    setTimeout(() => this.addedToCart = false, 2000);
  }

  formatPrice(n: number): string { return `Rs. ${n.toLocaleString()}`; }

  goBack(): void { window.history.back(); }
}

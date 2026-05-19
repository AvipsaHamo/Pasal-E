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
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
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
      next: p => {
        this.product  = p;
        this.loading  = false;
        this.activeImage = p.image ?? null;
        // Pre-select first variation if exists
        if (p.variations?.length) {
          this.selectedVariation = p.variations[0];
          if (p.variations[0].image) this.activeImage = p.variations[0].image;
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading = false;
        this.error   = err?.error?.message ?? 'Failed to load product.';
      }
    });
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
}

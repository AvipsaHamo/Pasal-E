// customer-frontend/src/app/shop/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerShopService, StorefrontProduct } from '../../core/services/shop.service';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  featured:       StorefrontProduct[] = [];
  loadingFeatured = true;
  featuredError   = '';
  private destroy$ = new Subject<void>();

  constructor(public shopSvc: CustomerShopService, private cartSvc: CartService) {}

  ngOnInit(): void {
    this.loadFeatured();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadFeatured(): void {
    this.loadingFeatured = true;
    this.featuredError   = '';
    this.shopSvc.getFeatured()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  p => { this.featured = p; this.loadingFeatured = false; },
        error: (err: { error?: { message?: string } }) => {
          this.loadingFeatured = false;
          this.featuredError   = err?.error?.message ?? 'Could not load featured products.';
        }
      });
  }

  addToCart(product: StorefrontProduct): void {
    const price = product.sellingPrice ?? product.variations?.[0]?.sellingPrice ?? 0;
    const variation = product.variations?.[0];
    this.cartSvc.addItem({
      productId: product.productId,
      name: product.name,
      image: product.image,
      price,
      variationId: variation?.variationId,
      variationName: variation?.name
    }, 1);
  }

  formatPrice(price?: number): string {
    if (price == null) return '—';
    return `Rs. ${price.toLocaleString()}`;
  }
}

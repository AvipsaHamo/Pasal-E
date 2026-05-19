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
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
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

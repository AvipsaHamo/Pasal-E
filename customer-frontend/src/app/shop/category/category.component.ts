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
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css']
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

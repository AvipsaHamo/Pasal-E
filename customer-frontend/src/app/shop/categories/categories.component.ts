import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerShopService, StorefrontCategory } from '../../core/services/shop.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class CategoriesComponent implements OnInit, OnDestroy {
  categories: StorefrontCategory[] = [];
  loading = true;
  error   = '';
  private destroy$ = new Subject<void>();

  constructor(public shopSvc: CustomerShopService) {}

  ngOnInit(): void {
    this.shopSvc.getCategories().pipe(takeUntil(this.destroy$)).subscribe({
      next:  c => { this.categories = c; this.loading = false; },
      error: (err: { error?: { message?: string } }) => {
        this.loading = false;
        this.error   = err?.error?.message ?? 'Failed to load categories.';
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}

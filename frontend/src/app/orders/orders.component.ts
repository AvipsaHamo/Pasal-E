import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { OrderService } from '../core/services/order.service';
import { OrderListItem, OrderFull } from '../core/models/order.models';
import { DestroyableComponent } from '../core/base/destroyable.base';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent extends DestroyableComponent implements OnInit {
  orders: OrderListItem[]               = [];
  expandedOrders: Map<number, OrderFull> = new Map();
  expandedIds:    Set<number>           = new Set();
  loadingIds:     Set<number>           = new Set();
  updatingIds:    Set<number>           = new Set();
  loading         = false;
  loadError       = '';

  activeFilter = '';
  showDropdown = false;

  readonly filterOptions = ['', 'Pending', 'In Progress', 'Delivered', 'Dismissed'];
  private readonly searchSubject = new Subject<string>();
  private searchQuery = '';

  constructor(private orderSvc: OrderService) { super(); }

  ngOnInit(): void {
    this.loadOrders();
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(q => { this.searchQuery = q; this.loadOrders(); });
  }

  loadOrders(): void {
    this.loading   = true;
    this.loadError = '';
    this.orderSvc.getOrders(this.activeFilter || undefined, this.searchQuery || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  o => { this.orders = o; this.loading = false; },
        error: (err: { error?: { message?: string } }) => {
          this.loading   = false;
          this.loadError = err?.error?.message ?? 'Failed to load orders.';
        }
      });
  }

  onSearch(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  setFilter(f: string): void {
    this.activeFilter = f;
    this.showDropdown = false;
    this.loadOrders();
  }

  toggleDropdown(): void { this.showDropdown = !this.showDropdown; }

  toggleExpand(order: OrderListItem): void {
    if (this.expandedIds.has(order.orderId)) {
      this.expandedIds.delete(order.orderId);
      return;
    }
    this.expandedIds.add(order.orderId);
    if (!this.expandedOrders.has(order.orderId)) {
      this.loadingIds.add(order.orderId);
      this.orderSvc.getOrder(order.orderId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: full => {
            this.expandedOrders.set(order.orderId, full);
            this.loadingIds.delete(order.orderId);
          },
          error: (err: { error?: { message?: string } }) => {
            this.loadingIds.delete(order.orderId);
            this.expandedIds.delete(order.orderId);
            console.error('Failed to load order detail:', err?.error?.message ?? err);
          }
        });
    }
  }

  isExpanded(id: number):  boolean { return this.expandedIds.has(id); }
  isLoading(id: number):   boolean { return this.loadingIds.has(id); }
  isUpdating(id: number):  boolean { return this.updatingIds.has(id); }
  getFullOrder(id: number): OrderFull | undefined { return this.expandedOrders.get(id); }

  updateStatus(orderId: number, status: string): void {
    this.updatingIds.add(orderId);
    this.orderSvc.updateStatus(orderId, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.updatingIds.delete(orderId);
          const o = this.orders.find(x => x.orderId === orderId);
          if (o) o.status = status;
          const full = this.expandedOrders.get(orderId);
          if (full) this.expandedOrders.set(orderId, { ...full, status });
          this.orders = [...this.orders].sort((a, b) => {
            const p: Record<string, number> = { Pending: 0, 'In Progress': 1, Delivered: 2, Dismissed: 3 };
            return (p[a.status] ?? 99) - (p[b.status] ?? 99);
          });
        },
        error: (err: { error?: { message?: string } }) => {
          this.updatingIds.delete(orderId);
          console.error('Status update failed:', err?.error?.message ?? err);
        }
      });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'Pending': 'status-pending', 'In Progress': 'status-inprogress',
      'Delivered': 'status-delivered', 'Dismissed': 'status-dismissed'
    };
    return map[status] ?? '';
  }
}

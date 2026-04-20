import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { OrderService } from '../core/services/order.service';
import { OrderListItem, OrderFull } from '../core/models/order.models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: OrderListItem[]           = [];
  expandedOrders: Map<number, OrderFull> = new Map();
  expandedIds: Set<number>          = new Set();
  loadingIds: Set<number>           = new Set();
  updatingIds: Set<number>          = new Set();
  loading                           = false;

  activeFilter = '';
  searchQuery  = '';
  showDropdown = false;

  readonly filterOptions = ['', 'Pending', 'In Progress', 'Delivered', 'Dismissed'];
  private searchSubject  = new Subject<string>();

  constructor(private orderSvc: OrderService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((q: string) => { this.searchQuery = q; this.loadOrders(); });
  }

  loadOrders(): void {
    this.loading = true;
    this.orderSvc.getOrders(this.activeFilter || undefined, this.searchQuery || undefined)
      .subscribe({
        next:  (o: OrderListItem[]) => { this.orders = o; this.loading = false; },
        error: () => { this.loading = false; }
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
      this.orderSvc.getOrder(order.orderId).subscribe({
        next: (full: OrderFull) => {
          this.expandedOrders.set(order.orderId, full);
          this.loadingIds.delete(order.orderId);
        },
        error: () => { this.loadingIds.delete(order.orderId); }
      });
    }
  }

  isExpanded(orderId: number): boolean  { return this.expandedIds.has(orderId); }
  isLoading(orderId: number): boolean   { return this.loadingIds.has(orderId); }
  isUpdating(orderId: number): boolean  { return this.updatingIds.has(orderId); }
  getFullOrder(orderId: number): OrderFull | undefined { return this.expandedOrders.get(orderId); }

  updateStatus(orderId: number, status: string): void {
    this.updatingIds.add(orderId);
    this.orderSvc.updateStatus(orderId, status).subscribe({
      next: () => {
        this.updatingIds.delete(orderId);
        // Update locally in list
        const o = this.orders.find(x => x.orderId === orderId);
        if (o) o.status = status;
        // Update in expanded cache
        const full = this.expandedOrders.get(orderId);
        if (full) this.expandedOrders.set(orderId, { ...full, status });
        // Re-sort list
        this.orders = this.sortOrders(this.orders);
      },
      error: () => { this.updatingIds.delete(orderId); }
    });
  }

  private sortOrders(orders: OrderListItem[]): OrderListItem[] {
    const priority: Record<string, number> = {
      'Pending': 0, 'In Progress': 1, 'Delivered': 2, 'Dismissed': 3
    };
    return [...orders].sort((a, b) =>
      (priority[a.status] ?? 99) - (priority[b.status] ?? 99));
  }

  getStatusClass(status: string): string {
    return {
      'Pending':     'status-pending',
      'In Progress': 'status-inprogress',
      'Delivered':   'status-delivered',
      'Dismissed':   'status-dismissed'
    }[status] ?? '';
  }
}

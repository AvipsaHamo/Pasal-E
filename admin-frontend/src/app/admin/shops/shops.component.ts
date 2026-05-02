// admin-frontend/src/app/admin/shops/shops.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { ShopAdminView } from '../../core/models/admin.models';

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shops.component.html',
  styleUrl: './shops.component.css'
})
export class ShopsComponent implements OnInit {
  shops:   ShopAdminView[] = [];
  loading = true;
  updatingIds = new Set<number>();
  filterStatus = '';

  readonly statuses = ['', 'pending', 'approved', 'disapproved'];

  constructor(public auth: AdminAuthService) {}

  ngOnInit(): void { this.loadShops(); }

  loadShops(): void {
    this.loading = true;
    this.auth.getShops().subscribe({
      next:  s => { this.shops = s; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filteredShops(): ShopAdminView[] {
    if (!this.filterStatus) return this.shops;
    return this.shops.filter(s => s.subdomainStatus === this.filterStatus);
  }

  setStatus(shopId: number, status: string): void {
    this.updatingIds.add(shopId);
    this.auth.updateSubdomainStatus(shopId, status).subscribe({
      next: updated => {
        this.updatingIds.delete(shopId);
        const idx = this.shops.findIndex(s => s.shopId === shopId);
        if (idx !== -1) this.shops[idx] = updated;
      },
      error: () => { this.updatingIds.delete(shopId); }
    });
  }

  isUpdating(shopId: number): boolean { return this.updatingIds.has(shopId); }

  statusClass(status: string): string {
    return {
      pending:     'badge-pending',
      approved:    'badge-approved',
      disapproved: 'badge-disapproved'
    }[status] ?? '';
  }

  pendingCount():    number { return this.shops.filter(s => s.subdomainStatus === 'pending').length; }
  approvedCount():   number { return this.shops.filter(s => s.subdomainStatus === 'approved').length; }
  disapprovedCount():number { return this.shops.filter(s => s.subdomainStatus === 'disapproved').length; }
}

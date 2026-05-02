// customer-frontend/src/app/core/services/shop.service.ts
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PublicShopInfo {
  shopId:    number;
  shopName:  string;
  brandName?: string;
  logoImage?: string;
  theme?:    string;
  colour?:   string;
}

@Injectable({ providedIn: 'root' })
export class CustomerShopService {
  private base = `${environment.apiBaseUrl}/storefront`;

  // Resolved from window.location.hostname on app init
  readonly shopName = signal<string>('');
  readonly shopInfo = signal<PublicShopInfo | null>(null);
  readonly cartCount = signal<number>(0);

  constructor(private http: HttpClient) {
    this.resolveShop();
  }

  private resolveShop(): void {
    const host = window.location.hostname; // e.g. "priyathreads.pasal-e.me"
    const parts = host.split('.');
    // In dev, use first segment; in prod, it's the subdomain
    const subdomain = parts.length >= 3 ? parts[0] : 'demo';
    this.shopName.set(subdomain);

    this.http.get<PublicShopInfo>(`${this.base}/${subdomain}`).subscribe({
      next: info => this.shopInfo.set(info)
    });
  }

  incrementCart(): void { this.cartCount.update(n => n + 1); }
  decrementCart(): void { this.cartCount.update(n => Math.max(0, n - 1)); }
}

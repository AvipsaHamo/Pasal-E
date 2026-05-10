import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ThemeService } from '../../theme/theme.service';

export interface PublicShopInfo {
  shopId:       number;
  shopName:     string;
  brandName?:   string;
  logoImage?:   string;
  bannerImage?: string;
  theme:        string;
  colour:       string;
}

export interface StorefrontProduct {
  productId:     number;
  name:          string;
  image?:        string;
  sellingPrice?: number;
  stock:         number;
  variations:    { variationId: number; name?: string; sellingPrice?: number }[];
}

@Injectable({ providedIn: 'root' })
export class CustomerShopService {
  private readonly base = `${environment.apiBaseUrl}/storefront`;

  readonly shopName  = signal<string>('');
  readonly shopInfo  = signal<PublicShopInfo | null>(null);
  readonly cartCount = signal<number>(0);
  readonly loading   = signal<boolean>(true);
  readonly error     = signal<string>('');

  constructor(private http: HttpClient, private themeSvc: ThemeService) {
    this.resolveShop();
  }

  private resolveShop(): void {
    const host      = window.location.hostname;
    const parts     = host.split('.');
    const subdomain = parts.length >= 3 ? parts[0] : 'demo';
    this.shopName.set(subdomain);

    this.http.get<PublicShopInfo>(`${this.base}/${subdomain}`).subscribe({
      next: info => {
        this.shopInfo.set(info);
        this.loading.set(false);
        this.themeSvc.applyTheme(info.theme, info.colour);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Shop not found or not yet approved.');
        this.themeSvc.applyTheme('Light', 'Green');
      }
    });
  }

  getFeatured() {
    return this.http.get<StorefrontProduct[]>(`${this.base}/${this.shopName()}/featured`);
  }

  getProducts(categoryId?: number, search?: string) {
    const params: Record<string, string> = {};
    if (categoryId) params['categoryId'] = String(categoryId);
    if (search)     params['search']      = search;
    return this.http.get<StorefrontProduct[]>(`${this.base}/${this.shopName()}/products`, { params });
  }

  getCategories() {
    return this.http.get<{ categoryId: number; name: string; image?: string }[]>(
      `${this.base}/${this.shopName()}/categories`);
  }

  incrementCart(): void { this.cartCount.update(n => n + 1); }
  decrementCart(): void { this.cartCount.update(n => Math.max(0, n - 1)); }
}

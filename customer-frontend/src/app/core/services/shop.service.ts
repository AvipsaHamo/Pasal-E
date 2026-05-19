import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  description?:  string;
  sellingPrice?: number;
  stock:         number;
  variations:    StorefrontVariation[];
}

export interface StorefrontVariation {
  variationId:   number;
  name?:         string;
  image?:        string;
  sellingPrice?: number;
}

export interface StorefrontCategory {
  categoryId: number;
  name:       string;
  image?:     string;
}

export interface PlaceOrderPayload {
  firstName:   string;
  lastName:    string;
  phone:       string;
  email?:      string;
  address:     string;
  landmark?:   string;
  paymentType: string;
  items: {
    productId:    number;
    variationId?: number;
    quantity:     number;
    price:        number;
    productName:  string;
    variationName?: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class CustomerShopService {
  private readonly base = `${environment.apiBaseUrl}/storefront`;

  readonly shopName  = signal<string>('');
  readonly shopInfo  = signal<PublicShopInfo | null>(null);
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

  getFeatured(): Observable<StorefrontProduct[]> {
    return this.http.get<StorefrontProduct[]>(`${this.base}/${this.shopName()}/featured`);
  }

  getCategories(): Observable<StorefrontCategory[]> {
    return this.http.get<StorefrontCategory[]>(`${this.base}/${this.shopName()}/categories`);
  }

  getProducts(categoryId?: number, search?: string, sort?: string): Observable<StorefrontProduct[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    if (search)     params = params.set('search', search);
    if (sort)       params = params.set('sort', sort);
    return this.http.get<StorefrontProduct[]>(
      `${this.base}/${this.shopName()}/products`, { params });
  }

  getProduct(productId: number): Observable<StorefrontProduct> {
    return this.http.get<StorefrontProduct>(
      `${this.base}/${this.shopName()}/products/${productId}`);
  }

  placeOrder(payload: PlaceOrderPayload): Observable<{ orderId: number; message: string }> {
    return this.http.post<{ orderId: number; message: string }>(
      `${this.base}/${this.shopName()}/orders`, payload);
  }
}

// src/app/core/services/shop.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ShopInfo, UpdateShopRequest,
  CategoryDetail, CreateCategoryRequest,
  ProductDetail, UpdateProductRequest
} from '../models/shop.models';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private base     = `${environment.apiBaseUrl}/shop`;
  private invBase  = `${environment.apiBaseUrl}/inventory`;

  constructor(private http: HttpClient) {}

  // ── Shop ──
  getShop(): Observable<ShopInfo> {
    return this.http.get<ShopInfo>(this.base);
  }

  updateShop(req: UpdateShopRequest): Observable<ShopInfo> {
    return this.http.patch<ShopInfo>(this.base, req);
  }

  // ── Categories via /api/shop ──
  getCategories(): Observable<CategoryDetail[]> {
    return this.http.get<CategoryDetail[]>(`${this.base}/categories`);
  }

  addCategory(req: CreateCategoryRequest): Observable<CategoryDetail> {
    return this.http.post<CategoryDetail>(`${this.base}/categories`, req);
  }

  deleteCategory(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/categories/${id}`);
  }

  // ── Product detail via /api/inventory ──
  getProductDetail(id: number): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.invBase}/products/${id}`);
  }

  updateProduct(id: number, req: UpdateProductRequest): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${this.invBase}/products/${id}`, req);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShopInfo, UpdateShopRequest, CategoryDetail, CreateCategoryRequest, ProductDetail, UpdateProductRequest } from '../models/shop.models';

export interface FeaturedProductItem {
  featuredId:    number;
  productId:     number;
  productName:   string;
  productImage?: string;
  sellingPrice?: number;
  sortOrder:     number;
}

export interface ImageUploadResponse { url: string; }

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly base    = `${environment.apiBaseUrl}/shop`;
  private readonly invBase = `${environment.apiBaseUrl}/inventory`;
  private readonly imgBase = `${environment.apiBaseUrl}/images`;

  constructor(private http: HttpClient) {}

  getShop(): Observable<ShopInfo>                       { return this.http.get<ShopInfo>(this.base); }
  updateShop(req: UpdateShopRequest): Observable<ShopInfo> { return this.http.patch<ShopInfo>(this.base, req); }

  uploadImage(file: File): Observable<ImageUploadResponse> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ImageUploadResponse>(`${this.imgBase}/upload`, fd);
  }

  getCategories(): Observable<CategoryDetail[]>     { return this.http.get<CategoryDetail[]>(`${this.base}/categories`); }
  addCategory(req: CreateCategoryRequest): Observable<CategoryDetail> { return this.http.post<CategoryDetail>(`${this.base}/categories`, req); }
  deleteCategory(id: number): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${this.base}/categories/${id}`); }

  getFeatured(): Observable<FeaturedProductItem[]>      { return this.http.get<FeaturedProductItem[]>(`${this.base}/featured`); }
  addFeatured(productId: number): Observable<FeaturedProductItem> { return this.http.post<FeaturedProductItem>(`${this.base}/featured`, { productId }); }
  removeFeatured(featuredId: number): Observable<{ message: string }> { return this.http.delete<{ message: string }>(`${this.base}/featured/${featuredId}`); }

  getProductDetail(id: number): Observable<ProductDetail>              { return this.http.get<ProductDetail>(`${this.invBase}/products/${id}`); }
  updateProduct(id: number, req: UpdateProductRequest): Observable<ProductDetail> { return this.http.put<ProductDetail>(`${this.invBase}/products/${id}`, req); }
}

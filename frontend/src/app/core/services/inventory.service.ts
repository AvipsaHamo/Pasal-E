// src/app/core/services/inventory.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, CreateProductRequest, ProductDto, ProductListItem } from '../models/inventory.models';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private base = `${environment.apiBaseUrl}/inventory`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  getProducts(search?: string): Observable<ProductListItem[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ProductListItem[]>(`${this.base}/products`, { params });
  }

  createProduct(req: CreateProductRequest): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${this.base}/products`, req);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OrderListItem, OrderFull } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base = `${environment.apiBaseUrl}/orders`;

  constructor(private http: HttpClient) {}

  getOrders(status?: string, search?: string): Observable<OrderListItem[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<OrderListItem[]>(this.base, { params });
  }

  getOrder(id: number): Observable<OrderFull> {
    return this.http.get<OrderFull>(`${this.base}/${id}`);
  }

  updateStatus(id: number, status: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.base}/${id}/status`, { status });
  }
}

// src/app/core/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary, ChartData, AvailableYears } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = `${environment.apiBaseUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(period: 'month' | 'year'): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/summary`, {
      params: new HttpParams().set('period', period)
    });
  }

  getChart(year: number, month: number): Observable<ChartData> {
    // Temporary logging to help debug missing chart data
    const params = new HttpParams().set('year', String(year)).set('month', String(month));
    console.debug('[DashboardService] GET', `${this.base}/chart`, { params: params.toString() });
    return this.http.get<ChartData>(`${this.base}/chart`, { params });
  }

  getAvailableYears(): Observable<AvailableYears> {
    return this.http.get<AvailableYears>(`${this.base}/years`);
  }
}

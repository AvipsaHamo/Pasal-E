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
    return this.http.get<ChartData>(`${this.base}/chart`, {
      params: new HttpParams().set('year', year).set('month', month)
    });
  }

  getAvailableYears(): Observable<AvailableYears> {
    return this.http.get<AvailableYears>(`${this.base}/years`);
  }
}

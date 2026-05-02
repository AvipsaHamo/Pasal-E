// admin-frontend/src/app/core/services/admin-auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminAuthResponse, AdminLoginRequest, ShopAdminView } from '../models/admin.models';

const TOKEN_KEY = 'pasale_admin_token';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private base = `${environment.apiBaseUrl}/admin`;

  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly isLoggedIn = computed(() => !!this._token());
  readonly token      = this._token.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  login(req: AdminLoginRequest): Observable<AdminAuthResponse> {
    return this.http.post<AdminAuthResponse>(`${this.base}/login`, req).pipe(
      tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        this._token.set(res.token);
      })
    );
  }

  getShops(): Observable<ShopAdminView[]> {
    return this.http.get<ShopAdminView[]>(`${this.base}/shops`);
  }

  updateSubdomainStatus(shopId: number, status: string): Observable<ShopAdminView> {
    return this.http.patch<ShopAdminView>(`${this.base}/shops/${shopId}/subdomain-status`, { status });
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this.router.navigate(['/login']);
  }
}

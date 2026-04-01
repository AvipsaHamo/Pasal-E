// src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  Owner,
  RegisterRequest,
  SetupShopRequest,
  Shop
} from '../models/auth.models';

const TOKEN_KEY = 'pasale_token';
const OWNER_KEY = 'pasale_owner';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiBaseUrl;

  // Signals for reactive state
  private _token  = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private _owner  = signal<Owner | null>(this.parseOwner());

  readonly isLoggedIn = computed(() => !!this._token());
  readonly owner      = this._owner.asReadonly();
  readonly token      = this._token.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, req)
      .pipe(tap(res => this.persist(res)));
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, req)
      .pipe(tap(res => this.persist(res)));
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/google`, { idToken })
      .pipe(tap(res => this.persist(res)));
  }

  setupShop(req: SetupShopRequest): Observable<Shop> {
    return this.http.post<Shop>(`${this.base}/auth/setup-shop`, req);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OWNER_KEY);
    this._token.set(null);
    this._owner.set(null);
    this.router.navigate(['/login']);
  }

  private persist(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(OWNER_KEY, JSON.stringify(res.owner));
    this._token.set(res.token);
    this._owner.set(res.owner);
  }

  private parseOwner(): Owner | null {
    try {
      const raw = localStorage.getItem(OWNER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

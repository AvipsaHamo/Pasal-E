// src/app/core/models/auth.models.ts

export interface Owner {
  ownerId: number;
  firstName: string;
  lastName: string;
  email: string;
  authProvider: 'local' | 'google';
}

export interface Shop {
  shopId: number;
  shopName: string;
  brandName?: string;
  subdomain?: string;
}

export interface AuthResponse {
  token: string;
  owner: Owner;
  needsShopSetup: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SetupShopRequest {
  brandName: string;
  subdomain: string;
}

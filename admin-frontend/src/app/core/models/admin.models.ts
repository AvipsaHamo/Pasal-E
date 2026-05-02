// admin-frontend/src/app/core/models/admin.models.ts

export interface AdminLoginRequest {
  email:    string;
  password: string;
}

export interface AdminAuthResponse {
  token: string;
  email: string;
}

export interface ShopAdminView {
  shopId:          number;
  ownerId:         number;
  ownerName:       string;
  ownerEmail:      string;
  shopName:        string;
  brandName?:      string;
  subdomain?:      string;
  subdomainStatus: string;
  physicalLocation?: string;
  theme?:          string;
  colour?:         string;
}

// src/app/core/models/inventory.models.ts

export interface Category {
  categoryId: number;
  name: string;
}

export interface ProductListItem {
  productId: number;
  name: string;
  vendorName?: string;
  stock: number;
  categoryName?: string;
}

export interface VariationRequest {
  name: string;
  sellingPrice?: number;
}

export interface CreateProductRequest {
  name: string;
  categoryId?: number;
  description?: string;
  vendorName?: string;
  stock: number;
  costPrice?: number;
  sellingPrice?: number;
  onlineAvailable: boolean;
  variations?: VariationRequest[];
}

export interface ProductDto {
  productId: number;
  name: string;
  categoryId?: number;
  categoryName?: string;
  description?: string;
  image?: string;
  vendorName?: string;
  stock: number;
  costPrice?: number;
  sellingPrice?: number;
  onlineAvailable: boolean;
  variations: { variationId: number; name?: string; sellingPrice?: number }[];
}

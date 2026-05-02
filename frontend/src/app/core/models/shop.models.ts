export interface ShopInfo {
  shopId:            number;
  shopName:          string;
  brandName?:        string;
  physicalLocation?: string;
  subdomain?:        string;
  subdomainStatus:   string; // pending | approved | disapproved
  theme?:            string;
  colour?:           string;
  logoImage?:        string;
  bannerImage?:      string;
}

export interface UpdateShopRequest {
  brandName?:        string;
  physicalLocation?: string;
  theme?:            string;
  colour?:           string;
  logoImage?:        string;
  bannerImage?:      string;
}

export interface CategoryDetail {
  categoryId: number;
  name:       string;
  image?:     string;
}

export interface CreateCategoryRequest {
  name:   string;
  image?: string;
}

export interface VariationDetail {
  variationId:   number;
  name?:         string;
  image?:        string;
  sellingPrice?: number;
}

export interface ProductDetail {
  productId:       number;
  name:            string;
  categoryId?:     number;
  categoryName?:   string;
  description?:    string;
  image?:          string;
  vendorName?:     string;
  stock:           number;
  costPrice?:      number;
  sellingPrice?:   number;
  onlineAvailable: boolean;
  variations:      VariationDetail[];
}

export interface UpsertVariationRequest {
  variationId?:  number;
  name:          string;
  image?:        string;
  sellingPrice?: number;
}

export interface UpdateProductRequest {
  name:            string;
  categoryId?:     number;
  description?:    string;
  image?:          string;
  vendorName?:     string;
  stock:           number;
  costPrice?:      number;
  sellingPrice?:   number;
  onlineAvailable: boolean;
  variations?:     UpsertVariationRequest[];
}

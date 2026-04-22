# Pasal-E
> "Build, run, and grow your store."

A multi-tenant e-commerce management platform for small shop owners. Each owner gets their own subdomain (e.g. `abc.pasal-e.me`) and a dashboard to manage inventory, orders, and customers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 (standalone components, signals) |
| Backend | ASP.NET Core 8 Web API |
| Database | PostgreSQL 14+ |
| Auth | JWT (local) |
| Hosting | Azure (student) — 2 Docker containers |
| Domain | `.me` with wildcard subdomain per shop |
| Charts | Chart.js 4 (via npm) |

---

## Project Structure

```
pasal-e/
├── frontend/
│   ├── angular.json
│   ├── tsconfig.json / tsconfig.app.json
│   ├── package.json                   # includes chart.js ^4.4.2
│   └── src/
│       ├── main.ts
│       ├── styles.css                 # Auth layout globals only
│       ├── index.html
│       ├── environments/
│       │   ├── environment.ts         # Dev: apiBaseUrl = localhost:5000
│       │   └── environment.prod.ts    # Prod: apiBaseUrl = Azure backend URL
│       └── app/
│           ├── app.component.ts
│           ├── app.config.ts          # provideRouter, provideHttpClient, jwtInterceptor
│           ├── app.routes.ts          # All routes — lazy loaded
│           ├── layout/
│           │   └── layout.component.ts
│           ├── navbar/
│           │   ├── navbar.component.ts/html/css
│           ├── auth/
│           │   ├── login/
│           │   ├── signup/
│           │   └── after-signup/
│           ├── core/
│           │   ├── guards/auth.guard.ts
│           │   ├── interceptors/jwt.interceptor.ts
│           │   ├── models/
│           │   │   ├── auth.models.ts
│           │   │   ├── inventory.models.ts
│           │   │   ├── order.models.ts
│           │   │   └── dashboard.models.ts
│           │   └── services/
│           │       ├── auth.service.ts
│           │       ├── inventory.service.ts
│           │       ├── order.service.ts
│           │       └── dashboard.service.ts
│           ├── dashboard/             # Revenue/Customers/Orders cards + line chart
│           ├── inventory/             # Product table + manual entry slide panel
│           ├── orders/                # Orders table with expandable row detail
│           ├── foresight/             # Stub
│           └── your-shop/             # Stub
│
└── backend/
    ├── PasalE.Api.csproj
    ├── Program.cs
    ├── .env.example
    ├── Properties/launchSettings.json
    ├── Configuration/ServiceExtensions.cs
    ├── Controllers/
    │   ├── AuthController.cs
    │   ├── InventoryController.cs
    │   ├── OrderController.cs
    │   └── DashboardController.cs
    ├── Services/
    │   ├── AuthService.cs
    │   ├── JwtService.cs
    │   ├── InventoryService.cs
    │   ├── OrderService.cs
    │   └── DashboardService.cs        # Live SQL aggregation — no caching needed at this scale
    ├── Repositories/
    │   ├── OwnerRepository.cs
    │   ├── ShopRepository.cs
    │   ├── InventoryRepository.cs
    │   └── OrderRepository.cs
    ├── Models/
    │   ├── Owner.cs / Shop.cs
    │   ├── Category.cs / Product.cs / Variation.cs
    │   ├── Customer.cs
    │   ├── Order.cs / OrderDetail.cs
    ├── DTOs/
    │   ├── AuthDTOs.cs
    │   ├── InventoryDTOs.cs
    │   ├── OrderDTOs.cs
    │   └── DashboardDTOs.cs
    ├── Data/
    │   ├── AppDbContext.cs
    │   └── migrations/
    │       ├── 001_initial.sql        # Full schema + ALTER TABLE additions
    │       └── 002_dummy_data.sql     # Test data for owner_id=5, shop_id=2
    └── Middleware/
        └── GlobalExceptionMiddleware.cs
```

---

## Database Schema (12 tables)

```
owner ──< shop ──< category
                └──< product ──< variation
                └──< receipt
          shop ──< orders ──< order_details
          customer ──< cart ──< cart_item
          shop ──< forecast
```

Key design decisions:
- Each `owner` has exactly one `shop` (1:1, `UNIQUE` FK)
- `google_id` / `subdomain` — partial unique indexes (`WHERE col IS NOT NULL`)
- `auth_provider` CHECK constraint: `'local'` or `'google'`
- `orders.status` DEFAULT `'Pending'`, NOT NULL
- `product.date_added` TIMESTAMP DEFAULT `CURRENT_TIMESTAMP` — used for expense tracking on dashboard
- `order_details` has `product_name` / `variation_name` snapshot columns — product name is preserved even if product is later deleted
- Variations are optional — variation selling price overrides product price

---

## Auth Flow

```
Register → JWT issued → needsShopSetup: true → /setup-shop → /dashboard
Login    → JWT issued → needsShopSetup: false (shop exists) → /dashboard
```

- JWT secret must be **32+ characters** (HS256 = 256-bit minimum)
- `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()` in `Program.cs` keeps `sub` as `sub`
- All authenticated endpoints resolve `shopId` via: JWT `sub` → owner → shop lookup

---

## Dashboard Logic

### Compute-on-the-fly decision
Dashboard data is **computed live** via SQL aggregates (no cached/stored summary). Rationale:
- At this scale (hundreds to low thousands of orders per shop), `SUM`/`COUNT`/`DATE_TRUNC` queries run in <10ms
- Storing precomputed data would require invalidation logic on every order insert/update/delete
- The `forecast` table is reserved for ML-generated predictions (Foresight page), not live aggregates
- If a single shop exceeds ~100k orders, revisit with PostgreSQL materialized views

### Card calculations
| Card | Current period | Comparison |
|------|---------------|------------|
| Revenue | `SUM(total_amount)` from `orders` | vs same range last period |
| Total Customers | `COUNT(DISTINCT customer_id)` from `orders` | vs same range last period |
| Total Orders | `COUNT(*)` from `orders` | vs same range last period |

**Month mode:** current calendar month vs previous calendar month  
**Year mode:** current year YTD vs same date range last year

### Chart data (Income vs Expense)
- **Income:** `SUM(total_amount)` from `orders` grouped by day for selected year+month
- **Expense:** `SUM(cost_price * stock)` from `product` grouped by `date_added` day
- Rendered as a smooth line chart via Chart.js 4

---

## API Endpoints

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | No | Create owner account |
| POST | `/login` | No | Login, returns JWT |
| POST | `/setup-shop` | JWT | Create shop after signup |
| GET | `/me` | JWT | Returns claims from token |

### Inventory — `/api/inventory`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | JWT | All categories for this shop |
| GET | `/products?search=` | JWT | All products, optional search |
| POST | `/products` | JWT | Create product + optional variations |

### Orders — `/api/orders`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/?status=&search=` | JWT | List orders (sorted: Pending→In Progress→Delivered→Dismissed) |
| GET | `/{id}` | JWT | Full order detail with customer info |
| PATCH | `/{id}/status` | JWT | Update order status |

### Dashboard — `/api/dashboard`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/summary?period=month\|year` | JWT | Revenue, customers, orders + deltas |
| GET | `/chart?year=&month=` | JWT | Daily income vs expense data for chart |
| GET | `/years` | JWT | Available years (from orders + products) |

---

## Local Development Setup

### Prerequisites
- Node.js v18+
- .NET 8 SDK
- PostgreSQL 14+
- Angular CLI: `npm install -g @angular/cli`

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE pasale_db;"
psql -U postgres -d pasale_db -f backend/Data/migrations/001_initial.sql
```

### 2. Load dummy data (optional — for testing dashboard with shop_id=2)
```bash
psql -U postgres -d pasale_db -f backend/Data/migrations/002_dummy_data.sql
# Then login with: priya@pasal-e.me  (set a real password hash or create via /api/auth/register)
```

### 3. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET (must be 32+ chars)
dotnet restore
dotnet run
# Runs on http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

### 4. Frontend
```bash
cd frontend
npm install          # installs chart.js too
ng serve
# Runs on http://localhost:4200
```

---

## Environment Variables

### Backend `.env`
```
DATABASE_URL=Host=localhost;Port=5432;Database=pasale_db;Username=postgres;Password=yourpassword
JWT_SECRET=your-secret-must-be-at-least-32-characters-long
JWT_ISSUER=pasal-e
JWT_AUDIENCE=pasal-e-users
JWT_EXPIRY_HOURS=24
FRONTEND_URL=http://localhost:4200
```

### Frontend `environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api',
  subdomainSuffix: '.pasal-e.me'
};
```

---

## Cloud Deployment Runbook

### A. Core rules
- CORS is checked at 2 places: ASP.NET Core app policy and Container Apps ingress policy
- Allow these production origins:
  - `https://pasal-e.me`
  - `https://www.pasal-e.me`
  - `https://<shop>.pasal-e.me`
  - `https://pasal-e-frontend.lemonforest-193fbb66.southeastasia.azurecontainerapps.io`

### B. Backend env vars (Container App)
```env
FRONTEND_URLS=https://pasal-e.me,https://www.pasal-e.me,https://pasal-e-frontend.lemonforest-193fbb66.southeastasia.azurecontainerapps.io
CORS_ALLOW_PASAL_ME_SUBDOMAINS=true
```

### C. Deploy backend image
Preferred:
```bash
az acr build -r pasaleregistry -t pasal-e-backend:latest ./backend
az containerapp update -n pasal-e-backend -g pasal-e-rg --image pasaleregistry.azurecr.io/pasal-e-backend:latest
```

If ACR build fails with `TasksOperationsNotAllowed` (common on Azure for Students), use local Docker:
```bash
docker build -t pasaleregistry.azurecr.io/pasal-e-backend:latest ./backend
docker push pasaleregistry.azurecr.io/pasal-e-backend:latest
az containerapp update -n pasal-e-backend -g pasal-e-rg --image pasaleregistry.azurecr.io/pasal-e-backend:latest
```

If `az acr login` fails with Docker socket permission:
```bash
sudo usermod -aG docker "$USER"
newgrp docker
az acr login --name pasaleregistry
```

### D. Force a new revision when needed
```bash
az containerapp update -n pasal-e-backend -g pasal-e-rg --set-env-vars FORCE_ROLLOUT="$(date +%s)"
```

### E. Verify CORS quickly
```bash
curl -i -X OPTIONS "https://pasal-e-backend.lemonforest-193fbb66.southeastasia.azurecontainerapps.io/api/auth/register" \
  -H "Origin: https://pasal-e.me" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```
Expected: response includes `Access-Control-Allow-Origin` matching the origin sent.

### F. Pre-release checklist
- [ ] Frontend production API URL is correct
- [ ] Backend env vars updated (`FRONTEND_URLS`, `CORS_ALLOW_PASAL_ME_SUBDOMAINS`)
- [ ] Ingress CORS intentionally configured
- [ ] Latest backend revision is active and serving 100% traffic

---

## Per-Component CSS Convention

Each screen has its own CSS file — **no shared stylesheet for app pages**:

| Component | CSS File |
|-----------|----------|
| Login / Signup / After-Signup | `src/styles.css` (auth layout globals) |
| Navbar | `navbar/navbar.component.css` |
| Dashboard | `dashboard/dashboard.component.css` |
| Inventory | `inventory/inventory.component.css` |
| Orders | `orders/orders.component.css` |
| Foresight / Your Shop | Own `.css` per component |

Use `styleUrl` (singular, Angular 17+) — not `styleUrls` (plural, old syntax).

---

## Feature Status

| Feature | Status |
|---------|--------|
| Auth (register/login/setup-shop) | ✅ Done |
| Inventory — product list | ✅ Done |
| Inventory — manual entry panel | ✅ Done |
| Inventory — product variations | ✅ Done |
| Orders — list with filter/search | ✅ Done |
| Orders — expandable detail view | ✅ Done |
| Orders — status update (PATCH) | ✅ Done |
| Dashboard — summary cards | ✅ Done |
| Dashboard — income vs expense chart | ✅ Done |
| Scan & Upload Receipt | UI present, disabled |
| Receipt Gallery | UI present, disabled |
| View Product Details | Button present, disabled |
| Product / variation image upload | Input present, no backend yet |
| Foresight / forecasting | Stub page |
| Your Shop settings | Stub page |

---

## Planned: Distributed Architecture

Currently monolithic — one backend URL handles everything. To split into microservices:

1. Each module (auth, inventory, orders, dashboard/foresight) gets its own `apiBaseUrl` in environment files
2. Each gets its own backend service/container
3. A gateway or subdomain routing handles traffic

No code changes needed inside services — only the environment URLs change.

---

## Changelog — Shop Customization & Product Details

### New backend files
| File | Description |
|------|-------------|
| `Models/Shop.cs` | Added `Colour` field |
| `DTOs/ShopDTOs.cs` | `ShopInfoDto`, `UpdateShopRequest`, `CreateCategoryRequest`, `CategoryDetailDto`, `ProductDetailDto`, `UpdateProductRequest`, `UpsertVariationRequest` |
| `Repositories/ShopRepository.cs` | Added `ICategoryRepository` / `CategoryRepository` |
| `Repositories/InventoryRepository.cs` | Added `GetVariationsByProductIdAsync`, `GetVariationByIdAsync`, `DeleteVariationAsync` |
| `Services/ShopService.cs` | Get/update shop info, category CRUD |
| `Services/InventoryService.cs` | Added `GetProductDetailAsync`, `UpdateProductAsync` |
| `Controllers/ShopController.cs` | `GET/PATCH /api/shop`, `GET/POST /api/shop/categories`, `DELETE /api/shop/categories/{id}` |
| `Controllers/InventoryController.cs` | Added `GET /api/inventory/products/{id}`, `PUT /api/inventory/products/{id}` |

### New API endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/shop` | Get current shop info |
| PATCH | `/api/shop` | Update brand name, location, theme, colour, images |
| GET | `/api/shop/categories` | List categories for this shop |
| POST | `/api/shop/categories` | Add a new category |
| DELETE | `/api/shop/categories/{id}` | Delete a category |
| GET | `/api/inventory/products/{id}` | Get full product detail with variations |
| PUT | `/api/inventory/products/{id}` | Update product + upsert variations |

### New frontend files
| File | Description |
|------|-------------|
| `core/models/shop.models.ts` | `ShopInfo`, `CategoryDetail`, `ProductDetail`, `UpdateProductRequest`, etc. |
| `core/services/shop.service.ts` | All shop + product detail HTTP calls |
| `inventory/product-detail/*` | Centered two-column modal: left col scrollable (description/vendor/stock/prices), right col scrollable (name/category/variations) |
| `your-shop/*` | Shop Customization page: logo, brand name, location, subdomain+copy, theme, colour, banner, category table with delete |

### Migration additions
```sql
-- Add colour column to shop table
ALTER TABLE shop ADD COLUMN IF NOT EXISTS colour VARCHAR(50);
```

### Product Detail modal behaviour
- Opens centered over the page (offset for 220px navbar)
- Backdrop click → close without saving
- "Return To Inventory" button → close without saving
- Left column: image placeholder, description, vendor, stock, cost/selling price — scrolls independently if content overflows
- Right column: product name, category dropdown, variation checkbox+list — right col scrolls when variations expand
- "Update Changes" button → PUT to backend, refreshes inventory list on success

### Your Shop behaviour
- Brand name change → updates both `shop_name` and `brand_name` in DB
- Subdomain shown as `subdomain.pasal-e.me` (read-only, copy to clipboard)
- Theme: Light / Dark; Colour: Green/Blue/Red/Purple/Pink/Brown/Gray
- Logo and Banner image: URL stored in DB (Azure Blob integration planned)
- Categories: live list with delete; Add Category → small centered modal (name + image URL)

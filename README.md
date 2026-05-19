# Pasal-E — Project Handoff Document
> Full context for continuing development in a new chat session.

---

## What This Project Is

Multi-tenant e-commerce platform for Nepali shop owners. Each owner gets a subdomain (`abc.pasal-e.me`), a dashboard to manage inventory and orders, and a customer-facing storefront. Admins approve subdomains before they go live.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Owner frontend | Angular 17 standalone — `frontend/` — port 4200 |
| Admin frontend | Angular 17 standalone — `admin-frontend/` — port 4201 |
| Customer frontend | Angular 17 standalone — `customer-frontend/` — port 4202 |
| Backend | ASP.NET Core 8 — single backend for all three |
| Database | PostgreSQL 14+ |
| Auth | JWT — `role=owner` and `role=admin` claims |
| Image storage | Azure Blob Storage (public container) |
| Hosting | Azure Container Apps (student account) |
| Fonts | Nunito (owner + admin), Poppins (customer) |
| Charts | Chart.js 4 (owner dashboard) |

---

## Folder Structure

```
pasal-e/
├── frontend/                        # Owner dashboard (port 4200)
│   ├── Dockerfile / nginx.conf
│   └── src/app/
│       ├── app.config.ts            # provideRouter, provideHttpClient, jwtInterceptor
│       ├── app.routes.ts            # all lazy-loaded routes
│       ├── layout/layout.component.ts
│       │     # Shell: app-shell (flex, height:100vh, overflow:hidden, bg:#4a5c24)
│       │     #        main-content (flex:1, height:100vh, overflow-y:auto,
│       │     #                      bg:#f0f4dc, border-radius:24px 0 0 24px)
│       │     # This keeps rounded top-left/bottom-left corners fixed while scrolling
│       ├── navbar/                  # Dark olive sidebar (220px, sticky)
│       ├── auth/login|signup|after-signup/
│       ├── core/
│       │   ├── base/destroyable.base.ts   # Abstract class, destroy$ Subject, takeUntil
│       │   ├── guards/auth.guard.ts
│       │   ├── interceptors/jwt.interceptor.ts
│       │   ├── models/ (auth, inventory, order, dashboard, shop models)
│       │   └── services/ (auth, inventory, order, dashboard, shop services)
│       ├── dashboard/               # Revenue/Customers/Orders + Chart.js line chart
│       ├── inventory/               # Product table + 3 action buttons:
│       │   │  # 1. "Add a new Product" → slide-in panel from right (52% width)
│       │   │  # 2. "Add Category" → Layer 1 centered window (z:200) →
│       │   │  #                      Layer 2 add modal (z:400)
│       │   │  #    Backdrop click Layer2 → back to Layer1
│       │   │  #    Backdrop click Layer1 → back to inventory
│       │   │  # 3. "Scan Barcode" → disabled stub
│       │   └── product-detail/     # Edit product + variations modal
│       ├── orders/                  # Table, expandable rows, status PATCH
│       ├── your-shop/               # Shop customization + Featured Products only
│       │                            # Category management REMOVED from here
│       └── foresight/               # Stub
│
├── admin-frontend/                  # Admin panel (port 4201)
│   └── src/app/
│       ├── core/base/destroyable.base.ts
│       ├── core/guards/admin.guard.ts
│       ├── core/interceptors/admin-jwt.interceptor.ts
│       ├── core/services/admin-auth.service.ts
│       ├── auth/login/admin-login.component.*
│       └── admin/shops/shops.component.*
│
├── customer-frontend/               # Storefront (port 4202, *.pasal-e.me)
│   └── src/app/
│       ├── theme/theme.service.ts   # Sets 16 CSS vars on document.documentElement
│       ├── core/services/
│       │   ├── shop.service.ts      # Resolves subdomain, applies theme, all API calls
│       │   └── cart.service.ts      # localStorage, signals, no auth needed
│       ├── navbar/customer-navbar.component.*
│       └── shop/
│           ├── home/                # Banner + featured products grid
│           ├── categories/          # 4-col circular image grid → /categories/:id
│           ├── category/            # Products filtered by category + back arrow
│           ├── products/            # All products + search bar + sort dropdown
│           ├── product-detail/      # Image gallery, variations, qty, add to cart
│           ├── cart/                # localStorage cart, qty controls, sticky footer
│           └── checkout/            # Form + order summary + place order → success
│
└── backend/                         # ASP.NET Core 8
    ├── Dockerfile / .env.example / deploy.sh
    ├── PasalE.Api.csproj            # Includes Azure.Storage.Blobs 12.19.1
    ├── Program.cs                   # JWT, AdminOnly policy, wildcard CORS
    ├── Configuration/ServiceExtensions.cs
    ├── Controllers/
    │   ├── AuthController.cs        # /api/auth
    │   ├── InventoryController.cs   # /api/inventory
    │   ├── OrderController.cs       # /api/orders
    │   ├── ShopController.cs        # /api/shop
    │   ├── DashboardController.cs   # /api/dashboard
    │   ├── AdminController.cs       # /api/admin
    │   ├── FeaturedController.cs    # /api/shop/featured
    │   ├── StorefrontController.cs  # /api/storefront (PUBLIC)
    │   ├── StorefrontOrderController.cs  # POST /api/storefront/{sub}/orders
    │   └── ImageController.cs       # /api/images/upload → Azure Blob
    ├── Services/ Repositories/ Models/ DTOs/
    └── Data/
        ├── AppDbContext.cs           # 13 tables mapped
        └── migrations/
            ├── 001_initial.sql
            ├── 002_dummy_data.sql
            └── 006_featured_products.sql
```

---

## Database Schema (13 tables)

```
owner ──< shop ──< category
                └──< product ──< variation
                └──< featured_product (UNIQUE shop_id+product_id)
          shop ──< orders ──< order_details (snapshot: product_name, variation_name)
          customer ──< cart ──< cart_item
          shop ──< forecast (stub)
          admin (standalone)
```

### Key columns

| Table | Notable columns |
|---|---|
| `shop` | `subdomain`, `subdomain_status` (pending/approved/disapproved), `theme` (Light/Dark), `colour` (Green/Blue/Red/Purple/Pink/Brown/Gray), `logo_image`, `banner_image` |
| `product` | `online_available`, `date_added` (for sorting) |
| `featured_product` | `shop_id`, `product_id`, `sort_order` — UNIQUE(shop_id, product_id) |
| `orders` | `status` DEFAULT 'Pending', `payment_type` |
| `order_details` | `product_name`, `variation_name` — snapshot columns |
| `admin` | `email`, `password` (bcrypt) |

---

## API Reference

### Public — `/api/storefront` (no auth)
| Method | Path | Notes |
|---|---|---|
| GET | `/{subdomain}` | Returns `shopId, shopName, brandName, logoImage, bannerImage, theme, colour` — only if approved |
| GET | `/{subdomain}/featured` | Featured products |
| GET | `/{subdomain}/categories` | All categories |
| GET | `/{subdomain}/products?categoryId=&search=&sort=` | sort: `price_asc`, `price_desc`, default=recently added |
| GET | `/{subdomain}/products/{productId}` | Single product with variations |
| POST | `/{subdomain}/orders` | Creates customer by phone if not exists, creates order + details |

### Owner — requires owner JWT
- `POST /api/auth/register|login|setup-shop` / `GET /api/auth/me`
- `GET|POST /api/inventory/products` / `GET|PUT /api/inventory/products/{id}`
- `GET|PATCH /api/orders` / `PATCH /api/orders/{id}/status`
- `GET|PATCH /api/shop` / `GET|POST|DELETE /api/shop/categories/{id}`
- `GET|POST|DELETE /api/shop/featured/{id}`
- `GET /api/dashboard/summary?period=` / `/chart?year=&month=` / `/years`
- `POST /api/images/upload` → Azure Blob → `{ url }`

### Admin — requires admin JWT (role=admin)
- `POST /api/admin/login`
- `GET /api/admin/shops`
- `PATCH /api/admin/shops/{id}/subdomain-status` → `{ status: "approved"|"disapproved"|"pending" }`

---

## Auth

- Owner JWT: `sub`=ownerId, `role`=owner. All owner endpoints resolve shopId via owner lookup.
- Admin JWT: `sub`=email, `role`=admin. Protected by `AdminOnly` policy.
- **JWT secret must be 32+ chars** (HS256 minimum).
- `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()` in Program.cs — keeps `sub` as `sub`.

---

## Customer Frontend — Key Details

### Theme System
`ThemeService.applyTheme(theme, colour)` sets 16 CSS vars on `document.documentElement`:
```
--c-primary  --c-primary-dark  --c-primary-light  --c-primary-muted
--c-accent   --c-bg-page  --c-bg-card  --c-bg-banner
--c-text-primary  --c-text-secondary  --c-text-on-primary
--c-border   --c-nav-bg  --c-nav-text  --c-nav-text-active  --c-badge-bg
```
7 colours × 2 modes = 14 design systems. Called once on app load from `CustomerShopService`. Every component uses only `var(--c-*)` — never hardcoded colours.

### Cart Service
- `localStorage` key: `pasale_cart`
- Angular signals: `items`, `count` (computed), `subtotal` (computed)
- Cart key per item: `productId-variationId` (or `productId-none`)
- Methods: `addItem`, `updateQty(delta)`, `removeItem`, `clear`
- No auth, no server state — fully client-side

### Subdomain Resolution
`window.location.hostname.split('.')[0]` → subdomain. Falls back to `'demo'` on localhost.

### Order Placement Flow
Customer fills checkout form → `POST /api/storefront/{sub}/orders` → backend finds/creates customer by phone → creates `orders` + `order_details` rows → appears in owner's Orders page immediately.

---

## Code Quality Standards

### Backend
- No DB calls in loops — `AddRange` + single `SaveChangesAsync`
- Transactions on create/update product (`BeginTransactionAsync` / `RollbackAsync`)
- Parallel queries with `Task.WhenAll`
- JOIN queries in services (not separate queries per entity)

### Frontend
- All components extend `DestroyableComponent` (has `destroy$` Subject)
- All subscriptions: `.pipe(takeUntil(this.destroy$))`
- No non-null assertions (`!`) — use `?? ''` instead
- Every `.subscribe()` has an `error` handler
- Env vars from `environment.ts` — never hardcoded URLs

---

## Layout Rounded Corners (Owner App)

The main content area has rounded top-left and bottom-left corners that stay fixed while scrolling. Achieved by:

```typescript
// layout.component.ts styles
.app-shell {
  display: flex;
  height: 100vh;        // ← locks to viewport
  overflow: hidden;     // ← prevents page-level scroll
  background: #4a5c24; // ← sidebar colour shows through corners
}
.main-content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;     // ← scrolling happens INSIDE this element
  background: #f0f4dc;
  border-radius: 24px 0 0 24px;
}
```
Scroll happens inside `.main-content`, so the element never moves — corners stay fixed.

---

## Local Development

```bash
# DB
psql -U postgres -c "CREATE DATABASE pasale_db;"
psql -U postgres -d pasale_db -f backend/Data/migrations/001_initial.sql
psql -U postgres -d pasale_db -f backend/Data/migrations/006_featured_products.sql

# First admin user
node -e "const b=require('bcryptjs');console.log(b.hashSync('yourpassword',11))"
psql -U postgres -d pasale_db -c "INSERT INTO admin (email,password) VALUES ('admin@pasal-e.me','<hash>');"

# Run
cd backend && dotnet run          # http://localhost:5000
cd frontend && ng serve           # http://localhost:4200
cd admin-frontend && ng serve     # http://localhost:4201
cd customer-frontend && ng serve  # http://localhost:4202
```

### Backend `.env`
```
DATABASE_URL=Host=localhost;Port=5432;Database=pasale_db;Username=postgres;Password=...
JWT_SECRET=at-least-32-characters-long-secret-key
JWT_ISSUER=pasal-e
JWT_AUDIENCE=pasal-e-users
JWT_EXPIRY_HOURS=24
FRONTEND_URLS=http://localhost:4200,http://localhost:4201,http://localhost:4202
CORS_ALLOW_PASAL_ME_SUBDOMAINS=false
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=pasal-e-images
```

---

## Feature Status

| Feature | Status |
|---|---|
| Owner auth (register/login/setup-shop) | ✅ |
| Inventory — list, add, edit with variations | ✅ |
| Category management in Inventory (layered modals) | ✅ |
| Orders — list, filter, expand, status update | ✅ |
| Dashboard — summary cards + Chart.js | ✅ |
| Shop customization — brand/location/theme/colour/images | ✅ |
| Image upload → Azure Blob | ✅ |
| Featured products management | ✅ |
| Subdomain status badge | ✅ |
| Layout rounded corners (fixed while scrolling) | ✅ |
| Admin login + shop approve/disapprove | ✅ |
| Customer theme engine (7×2 design systems) | ✅ |
| Customer navbar with live cart badge | ✅ |
| Customer home — banner + featured grid | ✅ |
| Customer categories — circular image grid | ✅ |
| Customer category page — filtered products | ✅ |
| Customer products page — search + sort | ✅ |
| Customer product detail — gallery/variants/qty | ✅ |
| Customer cart — localStorage, qty controls | ✅ |
| Customer checkout — form + order summary | ✅ |
| Order placed → appears in owner orders | ✅ |
| Foresight / forecasting | 🔜 |
| Receipt scan & upload | 🔜 |
| Customer auth | 🔜 |
| Payment gateway integration | 🔜 |

---

## Known Gotchas

1. **JWT secret < 32 chars** → `IDX10720` error
2. **`styleUrl`** (singular) not `styleUrls` (plural) — Angular 17
3. **`@for` track syntax** — `track item.id; let i = $index` not `track $index`
4. **Lazy routes** — each `loadComponent` import on its own line
5. **`DefaultInboundClaimTypeMap.Clear()`** required or `sub` claim maps to Microsoft URI
6. **Azure for Students** — use local `docker build && docker push`, not `az acr build`
7. **Partial unique index** for nullable columns: `.HasFilter("col IS NOT NULL")`
8. **Rounded corners scroll fix** — scroll must happen inside `.main-content` not on `body`. Use `height:100vh; overflow:hidden` on shell and `height:100vh; overflow-y:auto` on main.

---

## Deployment (Azure Container Apps)

4 containers: `pasal-e-backend` (port 8080), `pasal-e-frontend`, `pasal-e-admin`, `pasal-e-customer` (all nginx port 80).

DNS: `*.pasal-e.me` CNAME → `pasal-e-customer` FQDN. One container serves ALL shops — Angular reads hostname at runtime.

CORS in prod: set `CORS_ALLOW_PASAL_ME_SUBDOMAINS=true` + explicit list in `FRONTEND_URLS`.

Full script: `deploy.sh` in project root.
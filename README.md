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

---

## Project Structure

```
pasal-e/
├── frontend/                          # Angular 17 SPA
│   ├── angular.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── package.json
│   └── src/
│       ├── main.ts                    # Bootstrap
│       ├── styles.css                 # Auth layout globals only
│       ├── index.html
│       ├── environments/
│       │   ├── environment.ts         # Dev: apiBaseUrl = localhost:5000
│       │   └── environment.prod.ts    # Prod: apiBaseUrl = Azure backend URL
│       └── app/
│           ├── app.component.ts       # Root shell (<router-outlet>)
│           ├── app.config.ts          # provideRouter, provideHttpClient, jwtInterceptor
│           ├── app.routes.ts          # All routes — lazy loaded
│           ├── layout/
│           │   └── layout.component.ts    # Authenticated shell: navbar + <router-outlet>
│           ├── navbar/
│           │   ├── navbar.component.ts    # Sidebar nav with routerLinkActive
│           │   ├── navbar.component.html
│           │   └── navbar.component.css   # Own CSS — dark olive sidebar
│           ├── auth/
│           │   ├── login/             # Email + password login
│           │   ├── signup/            # Registration with password confirm
│           │   └── after-signup/      # Shop setup: brand name + subdomain
│           ├── core/
│           │   ├── guards/
│           │   │   └── auth.guard.ts  # authGuard (requires JWT) + guestGuard (redirects if logged in)
│           │   ├── interceptors/
│           │   │   └── jwt.interceptor.ts  # Attaches Bearer token to every HTTP request
│           │   ├── models/
│           │   │   ├── auth.models.ts      # Owner, Shop, AuthResponse, RegisterRequest, LoginRequest
│           │   │   └── inventory.models.ts # Category, ProductListItem, CreateProductRequest, ProductDto
│           │   └── services/
│           │       ├── auth.service.ts     # Signals-based auth state, localStorage persistence
│           │       └── inventory.service.ts
│           ├── inventory/
│           │   ├── inventory.component.ts  # Product table + manual entry panel logic
│           │   ├── inventory.component.html
│           │   └── inventory.component.css # Own CSS — cream/olive inventory page
│           ├── dashboard/             # Stub — shows welcome message
│           ├── orders/                # Stub
│           ├── foresight/             # Stub
│           └── your-shop/             # Stub
│
└── backend/                           # ASP.NET Core 8 Web API
    ├── PasalE.Api.csproj
    ├── Program.cs                     # DI wiring, JWT config, CORS, middleware pipeline
    ├── .env.example                   # Copy to .env and fill in values
    ├── Properties/
    │   └── launchSettings.json        # Runs on http://localhost:5000
    ├── Configuration/
    │   └── ServiceExtensions.cs       # Registers all repos + services in one place
    ├── Controllers/
    │   ├── AuthController.cs          # POST /api/auth/register|login|setup-shop, GET /api/auth/me
    │   └── InventoryController.cs     # GET /api/inventory/categories|products, POST /api/inventory/products
    ├── Services/
    │   ├── AuthService.cs             # Register, Login, SetupShop business logic
    │   ├── JwtService.cs              # GenerateToken, ValidateAndGetOwnerId
    │   └── InventoryService.cs        # GetCategories, GetProducts, CreateProduct+Variations
    ├── Repositories/
    │   ├── OwnerRepository.cs         # CRUD on owner table
    │   ├── ShopRepository.cs          # Lookup by owner_id or subdomain
    │   └── InventoryRepository.cs     # Products, categories, variations
    ├── Models/                        # EF Core entity classes (map 1:1 to DB tables)
    │   ├── Owner.cs
    │   ├── Shop.cs
    │   ├── Category.cs
    │   ├── Product.cs
    │   └── Variation.cs
    ├── DTOs/
    │   ├── AuthDTOs.cs                # RegisterRequest, LoginRequest, AuthResponse, OwnerDto, ShopDto
    │   └── InventoryDTOs.cs           # CategoryDto, ProductListItemDto, CreateProductRequest, VariationDto
    ├── Data/
    │   ├── AppDbContext.cs            # EF Core DbContext — all table mappings
    │   └── migrations/
    │       └── 001_initial.sql        # Full schema — run manually against PostgreSQL
    └── Middleware/
        └── GlobalExceptionMiddleware.cs  # Maps exceptions to HTTP status codes; surfaces real errors in Development
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
- `google_id` has a partial unique index (`WHERE google_id IS NOT NULL`) to allow multiple NULL rows
- `subdomain` has a partial unique index too — same reason
- `auth_provider` is a CHECK constraint: `'local'` or `'google'`
- Variations are optional per product — selling price on variation overrides product price

---

## Auth Flow

```
Register → JWT issued → needsShopSetup: true → /setup-shop → /dashboard
Login    → JWT issued → needsShopSetup: false (if shop exists) → /dashboard
```

- JWT secret must be **32+ characters** (HS256 = 256-bit minimum)
- `JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear()` is called in `Program.cs` so `sub` stays as `sub` (not remapped to a Microsoft URI claim)
- All authenticated endpoints resolve `shopId` from the JWT `sub` → owner → shop lookup

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

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET (must be 32+ chars)
dotnet restore
dotnet run
# Runs on http://localhost:5000
# Swagger UI: http://localhost:5000/swagger
```

### 3. Frontend
```bash
cd frontend
npm install
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
  apiBaseUrl: 'http://localhost:5000/api',  // All modules point here — easy to split later
  subdomainSuffix: '.pasal-e.me'
};
```

---

## Cloud Deployment Runbook

Use this as the source of truth when deploying to Azure.

### A. Core rules

- CORS is checked at 2 places: app policy (ASP.NET Core) and Container Apps ingress policy.
- Ingress CORS can override app CORS behavior.
- For this project, allow these production origins:
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

If image tag is unchanged (`:latest`) and rollout seems stale:

```bash
az containerapp update -n pasal-e-backend -g pasal-e-rg --set-env-vars FORCE_ROLLOUT="$(date +%s)"
```

### E. Verify CORS quickly

Root domain preflight:

```bash
curl -i -X OPTIONS "https://pasal-e-backend.lemonforest-193fbb66.southeastasia.azurecontainerapps.io/api/auth/register" \
  -H "Origin: https://pasal-e.me" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Subdomain preflight:

```bash
curl -i -X OPTIONS "https://pasal-e-backend.lemonforest-193fbb66.southeastasia.azurecontainerapps.io/api/auth/register" \
  -H "Origin: https://abc.pasal-e.me" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Expected: response includes `Access-Control-Allow-Origin` with the same origin sent in the request.

### F. Pre-release checklist

- Frontend production API URL is correct.
- Backend env vars are updated (`FRONTEND_URLS`, `CORS_ALLOW_PASAL_ME_SUBDOMAINS`).
- Ingress CORS is intentionally configured (or intentionally disabled).
- Latest backend revision is active and serving 100% traffic.


---

## Per-Component CSS Convention

Each screen has its own CSS file — **no shared stylesheet for app pages** (auth pages share `styles.css` only):

| Component | CSS File |
|-----------|----------|
| Login / Signup / After-Signup | `src/styles.css` (auth layout globals) |
| Navbar | `navbar/navbar.component.css` |
| Inventory | `inventory/inventory.component.css` |
| Dashboard / Orders / Foresight / Your Shop | Own `.css` file per component |

Use `styleUrl` (singular, Angular 17+) in the decorator — not `styleUrls` (plural, old syntax).

---

## Known Disabled Features (Planned)

| Feature | Status |
|---------|--------|
| Scan & Upload Receipt | UI present, disabled |
| Receipt Gallery | UI present, disabled |
| View Product Details | Button present, disabled |
| Dashboard charts | Stub page |
| Orders management | Stub page |
| Foresight / forecasting | Stub page |
| Your Shop settings | Stub page |
| Product image upload | Input present, no backend yet |
| Variation image upload | Input present, no backend yet |

---

## Planned: Distributed Architecture

Currently monolithic — one backend handles everything. The `apiBaseUrl` in `environment.ts` is intentionally a single value. To split into microservices later:

1. Each module (auth, inventory, orders, foresight) gets its own `apiBaseUrl` in the environment files
2. Each gets its own backend service/container
3. A gateway or subdomain routing handles traffic

No code changes needed inside services — only the environment URLs change.
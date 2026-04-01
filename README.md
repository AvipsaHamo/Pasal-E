# Pasal-E — Build, run, and grow your store.

## Architecture

```
pasal-e/
├── frontend/          # Angular 17+ SPA
│   └── src/
│       ├── app/
│       │   ├── auth/          # Login, Signup, After-Signup pages
│       │   ├── core/          # Guards, Interceptors, Services, Models
│       │   └── shared/        # Reusable components
│       └── environments/      # API base URLs (env variables)
└── backend/           # ASP.NET Core 8 Web API (MVC)
    ├── Controllers/   # API endpoints
    ├── Services/      # Business logic
    ├── Repositories/  # Data access
    ├── Models/        # Domain models
    ├── DTOs/          # Request/response shapes
    ├── Data/          # DbContext, migrations
    ├── Middleware/    # JWT, error handling
    └── Configuration/ # Extension methods, DI setup
```

## Setup

### Backend
```bash
cd backend
cp .env.example .env   # fill in your values
dotnet restore
dotnet ef database update
dotnet run
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

## Environment Variables

Backend `.env`:
- `DATABASE_URL` — PostgreSQL connection string  
- `JWT_SECRET` — Secret key for JWT signing  
- `JWT_ISSUER` / `JWT_AUDIENCE`  
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`  
- `FRONTEND_URL` — CORS allowed origin  

Frontend `environments/`:
- `apiBaseUrl` — Points to backend (same URL for all modules now, easy to split later)
- `googleClientId`

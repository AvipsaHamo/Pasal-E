using dotenv.net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PasalE.Api.Configuration;
using PasalE.Api.Data;
using PasalE.Api.Middleware;
using PasalE.Api.Models;
using System.Text;
using System.Text.Json;

DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);

// ── ENV ───────────────────────────────────────────────────────────────────
var jwtSecret   = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new InvalidOperationException("JWT_SECRET not set.");
var jwtIssuer   = Environment.GetEnvironmentVariable("JWT_ISSUER")   ?? "pasal-e";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")  ?? "pasal-e-users";
var dbUrl       = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? throw new InvalidOperationException("DATABASE_URL not set.");

// Comma-separated list of exact allowed origins (owner + admin + local dev)
var explicitOrigins = (Environment.GetEnvironmentVariable("FRONTEND_URLS") ?? "http://localhost:4200")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

// Whether to also allow ALL *.pasal-e.me subdomains (customer storefronts)
var allowSubdomains = (Environment.GetEnvironmentVariable("CORS_ALLOW_PASAL_ME_SUBDOMAINS") ?? "false")
    .Equals("true", StringComparison.OrdinalIgnoreCase);

// ── Services ──────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddDbContext<AppDbContext>(opts => opts.UseNpgsql(dbUrl));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.MapInboundClaims = false;
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            NameClaimType            = "sub",
            RoleClaimType            = "role"
        };
    });

builder.Services.AddAuthorization(opts =>
{
    opts.AddPolicy("AdminOnly", policy => policy.RequireClaim("role", "admin"));
});

// ── CORS ──────────────────────────────────────────────────────────────────
builder.Services.AddCors(opts =>
{
    opts.AddPolicy("Frontend", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();

        if (allowSubdomains)
        {
            // Use SetIsOriginAllowed so we can do wildcard matching for *.pasal-e.me
            policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin)) return false;

                // Always allow explicitly listed origins
                if (explicitOrigins.Contains(origin)) return true;

                // Allow any https://*.pasal-e.me (customer storefronts)
                try
                {
                    var uri = new Uri(origin);
                    return uri.Host.EndsWith(".pasal-e.me", StringComparison.OrdinalIgnoreCase)
                        && uri.Scheme == "https";
                }
                catch { return false; }
            });
        }
        else
        {
            // Dev mode — exact origin list only
            policy.WithOrigins(explicitOrigins);
        }
    });
});

builder.Services.AddApplicationServices();

// ── Pipeline ──────────────────────────────────────────────────────────────
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    await SeedDemoStorefrontAsync(app.Services);
}

app.Run();

static async Task SeedDemoStorefrontAsync(IServiceProvider services)
{
    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (await db.Shops.AnyAsync(s => s.Subdomain == "demo"))
    {
        return;
    }

    var owner = await db.Owners.FirstOrDefaultAsync(o => o.Email == "demo@pasal-e.local");
    if (owner is null)
    {
        owner = new Owner
        {
            FirstName = "Demo",
            LastName = "Shop",
            Email = "demo@pasal-e.local",
            AuthProvider = "local"
        };
        db.Owners.Add(owner);
        await db.SaveChangesAsync();
    }

    var shop = new Shop
    {
        OwnerId = owner.OwnerId,
        ShopName = "demo",
        BrandName = "Demo Market",
        Currency = "NPR",
        Subdomain = "demo",
        SubdomainStatus = "approved",
        Theme = "Light",
        Colour = "Green",
        LogoImage = null,
        BannerImage = null
    };
    db.Shops.Add(shop);
    await db.SaveChangesAsync();

    var groceries = new Category { ShopId = shop.ShopId, Name = "Groceries" };
    var fresh = new Category { ShopId = shop.ShopId, Name = "Fresh Produce" };
    db.Categories.AddRange(groceries, fresh);
    await db.SaveChangesAsync();

    var rice = new Product
    {
        ShopId = shop.ShopId,
        CategoryId = groceries.CategoryId,
        Name = "Premium Rice",
        Description = "A local staple for everyday meals.",
        Stock = 25,
        SellingPrice = 1200,
        OnlineAvailable = true
    };

    var lentils = new Product
    {
        ShopId = shop.ShopId,
        CategoryId = groceries.CategoryId,
        Name = "Masoor Dal",
        Description = "Protein-rich lentils for quick cooking.",
        Stock = 40,
        SellingPrice = 180,
        OnlineAvailable = true
    };

    var apples = new Product
    {
        ShopId = shop.ShopId,
        CategoryId = fresh.CategoryId,
        Name = "Fresh Apples",
        Description = "Crisp seasonal apples.",
        Stock = 18,
        SellingPrice = 300,
        OnlineAvailable = true
    };

    db.Products.AddRange(rice, lentils, apples);
    await db.SaveChangesAsync();

    db.FeaturedProducts.AddRange(
        new FeaturedProduct { ShopId = shop.ShopId, ProductId = rice.ProductId, SortOrder = 1 },
        new FeaturedProduct { ShopId = shop.ShopId, ProductId = apples.ProductId, SortOrder = 2 }
    );

    await db.SaveChangesAsync();
}
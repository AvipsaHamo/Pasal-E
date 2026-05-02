using dotenv.net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PasalE.Api.Configuration;
using PasalE.Api.Data;
using PasalE.Api.Middleware;
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

app.Run();
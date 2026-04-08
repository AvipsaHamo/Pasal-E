using dotenv.net;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PasalE.Api.Configuration;
using PasalE.Api.Data;
using PasalE.Api.Middleware;
using System.Text;
using System.Text.Json;

// Load .env in development
DotEnv.Load();

var builder = WebApplication.CreateBuilder(args);

// ── Configuration from ENV ─────────────────────────────────────────────────
var jwtSecret   = Environment.GetEnvironmentVariable("JWT_SECRET")!;
var jwtIssuer   = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "pasal-e";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "pasal-e-users";
var dbUrl       = Environment.GetEnvironmentVariable("DATABASE_URL")!;

// Supports multiple origins via FRONTEND_URLS and a single FRONTEND_URL fallback.
var rawFrontendUrls =
    Environment.GetEnvironmentVariable("FRONTEND_URLS")
    ?? Environment.GetEnvironmentVariable("FRONTEND_URL")
    ?? "http://localhost:4200";

var frontendUrls = rawFrontendUrls
    .Split(',', StringSplitOptions.RemoveEmptyEntries)
    .Select(url => url.Trim().TrimEnd('/'))
    .Where(url => !string.IsNullOrWhiteSpace(url))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

// ── Services ───────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(dbUrl));

// JWT Authentication
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
        };
    });

builder.Services.AddAuthorization();


builder.Services.AddCors(opts =>
    opts.AddPolicy("Frontend", policy =>
        policy.WithOrigins(frontendUrls) 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()));

// App services
builder.Services.AddApplicationServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// ── Middleware pipeline ────────────────────────────────────────────────────
app.UseRouting();
app.UseCors("Frontend");
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
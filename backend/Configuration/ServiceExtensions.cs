using PasalE.Api.Repositories;
using PasalE.Api.Services;

namespace PasalE.Api.Configuration;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped<IOwnerRepository, OwnerRepository>();
        services.AddScoped<IShopRepository, ShopRepository>();

        // Services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();

        return services;
    }
}
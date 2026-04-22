using PasalE.Api.Repositories;
using PasalE.Api.Services;

namespace PasalE.Api.Configuration;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IOwnerRepository, OwnerRepository>();
        services.AddScoped<IShopRepository, ShopRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IInventoryRepository, InventoryRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IShopService, ShopService>();

        return services;
    }
}

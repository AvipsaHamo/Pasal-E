using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.Models;

namespace PasalE.Api.Repositories;

public interface IShopRepository
{
    Task<Shop?> GetByOwnerIdAsync(int ownerId);
    Task<Shop?> GetBySubdomainAsync(string subdomain);
    Task<Shop>  CreateAsync(Shop shop);
    Task        SaveChangesAsync();
}

public class ShopRepository : IShopRepository
{
    private readonly AppDbContext _db;
    public ShopRepository(AppDbContext db) => _db = db;

    public Task<Shop?> GetByOwnerIdAsync(int ownerId) =>
        _db.Shops.FirstOrDefaultAsync(s => s.OwnerId == ownerId);

    public Task<Shop?> GetBySubdomainAsync(string subdomain) =>
        _db.Shops.FirstOrDefaultAsync(s => s.Subdomain == subdomain);

    public async Task<Shop> CreateAsync(Shop shop)
    {
        _db.Shops.Add(shop);
        await _db.SaveChangesAsync();
        return shop;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}

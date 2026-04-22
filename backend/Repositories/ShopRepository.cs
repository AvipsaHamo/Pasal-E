using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.Models;

namespace PasalE.Api.Repositories;

public interface IShopRepository
{
    Task<Shop?>  GetByOwnerIdAsync(int ownerId);
    Task<Shop?>  GetBySubdomainAsync(string subdomain);
    Task<Shop>   CreateAsync(Shop shop);
    Task         SaveChangesAsync();
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

// ── Category Repository ──────────────────────────────────────────────────

public interface ICategoryRepository
{
    Task<List<Category>> GetByShopIdAsync(int shopId);
    Task<Category?>      GetByIdAsync(int categoryId, int shopId);
    Task<Category>       CreateAsync(Category category);
    Task                 DeleteAsync(Category category);
    Task                 SaveChangesAsync();
}

public class CategoryRepository : ICategoryRepository
{
    private readonly AppDbContext _db;
    public CategoryRepository(AppDbContext db) => _db = db;

    public Task<List<Category>> GetByShopIdAsync(int shopId) =>
        _db.Categories.Where(c => c.ShopId == shopId).OrderBy(c => c.CategoryId).ToListAsync();

    public Task<Category?> GetByIdAsync(int categoryId, int shopId) =>
        _db.Categories.FirstOrDefaultAsync(c => c.CategoryId == categoryId && c.ShopId == shopId);

    public async Task<Category> CreateAsync(Category category)
    {
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return category;
    }

    public async Task DeleteAsync(Category category)
    {
        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}

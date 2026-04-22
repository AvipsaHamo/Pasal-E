using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.Models;

namespace PasalE.Api.Repositories;

public interface IInventoryRepository
{
    Task<List<Category>> GetCategoriesAsync(int shopId);
    Task<List<Product>>  GetProductsAsync(int shopId, string? search = null);
    Task<Product?>       GetProductByIdAsync(int productId, int shopId);
    Task<List<Variation>> GetVariationsByProductIdAsync(int productId);
    Task<Product>        CreateProductAsync(Product product);
    Task<Variation>      CreateVariationAsync(Variation variation);
    Task<Variation?>     GetVariationByIdAsync(int variationId, int productId);
    Task                 DeleteVariationAsync(Variation variation);
    Task                 SaveChangesAsync();
}

public class InventoryRepository : IInventoryRepository
{
    private readonly AppDbContext _db;
    public InventoryRepository(AppDbContext db) => _db = db;

    public Task<List<Category>> GetCategoriesAsync(int shopId) =>
        _db.Categories.Where(c => c.ShopId == shopId).ToListAsync();

    public Task<List<Product>> GetProductsAsync(int shopId, string? search = null)
    {
        var q = _db.Products.Where(p => p.ShopId == shopId);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Name.ToLower().Contains(search.ToLower()));
        return q.OrderBy(p => p.ProductId).ToListAsync();
    }

    public Task<Product?> GetProductByIdAsync(int productId, int shopId) =>
        _db.Products.FirstOrDefaultAsync(p => p.ProductId == productId && p.ShopId == shopId);

    public Task<List<Variation>> GetVariationsByProductIdAsync(int productId) =>
        _db.Variations.Where(v => v.ProductId == productId).ToListAsync();

    public async Task<Product> CreateProductAsync(Product product)
    {
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        return product;
    }

    public async Task<Variation> CreateVariationAsync(Variation variation)
    {
        _db.Variations.Add(variation);
        await _db.SaveChangesAsync();
        return variation;
    }

    public Task<Variation?> GetVariationByIdAsync(int variationId, int productId) =>
        _db.Variations.FirstOrDefaultAsync(v => v.VariationId == variationId && v.ProductId == productId);

    public async Task DeleteVariationAsync(Variation variation)
    {
        _db.Variations.Remove(variation);
        await _db.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}

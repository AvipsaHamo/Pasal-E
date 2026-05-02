using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.DTOs;
using PasalE.Api.Models;
using PasalE.Api.Repositories;

namespace PasalE.Api.Services;

public interface IInventoryService
{
    Task<List<CategoryDto>>        GetCategoriesAsync(int shopId);
    Task<List<ProductListItemDto>> GetProductsAsync(int shopId, string? search);
    Task<ProductDto>               CreateProductAsync(int shopId, CreateProductRequest req);
    Task<ProductDetailDto?>        GetProductDetailAsync(int productId, int shopId);
    Task<ProductDetailDto>         UpdateProductAsync(int productId, int shopId, UpdateProductRequest req);
}

public class InventoryService : IInventoryService
{
    private readonly IInventoryRepository _repo;
    private readonly AppDbContext         _db;

    public InventoryService(IInventoryRepository repo, AppDbContext db)
    {
        _repo = repo;
        _db   = db;
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync(int shopId)
    {
        var cats = await _repo.GetCategoriesAsync(shopId);
        return cats.Select(c => new CategoryDto(c.CategoryId, c.Name)).ToList();
    }

    public async Task<List<ProductListItemDto>> GetProductsAsync(int shopId, string? search)
    {
        // Both queries are flat — no N+1, no loop, one catMap lookup per product
        var productsTask   = _repo.GetProductsAsync(shopId, search);
        var categoriesTask = _repo.GetCategoriesAsync(shopId);
        await Task.WhenAll(productsTask, categoriesTask);

        var catMap = categoriesTask.Result.ToDictionary(c => c.CategoryId, c => c.Name);

        return productsTask.Result.Select(p => new ProductListItemDto(
            p.ProductId, p.Name, p.VendorName, p.Stock,
            p.CategoryId.HasValue && catMap.TryGetValue(p.CategoryId.Value, out var catName)
                ? catName : null
        )).ToList();
    }

    public async Task<ProductDto> CreateProductAsync(int shopId, CreateProductRequest req)
    {
        //product + all variations commit atomically.
        // A single variation failure rolls back the product insert too.
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var product = new Product
            {
                ShopId = shopId, CategoryId = req.CategoryId, Name = req.Name,
                Description = req.Description, VendorName = req.VendorName, Stock = req.Stock,
                CostPrice = req.CostPrice, SellingPrice = req.SellingPrice,
                OnlineAvailable = req.OnlineAvailable, DateAdded = DateTime.UtcNow
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync(); // flush so product.ProductId is assigned

            var variationDtos = new List<VariationDto>();
            if (req.Variations is { Count: > 0 })
            {
                // AddRange + single SaveChanges — not one await per variation
                var variations = req.Variations.Select(v => new Variation
                {
                    ProductId = product.ProductId, Name = v.Name, SellingPrice = v.SellingPrice
                }).ToList();

                _db.Variations.AddRange(variations);
                await _db.SaveChangesAsync();

                variationDtos = variations
                    .Select(v => new VariationDto(v.VariationId, v.Name, v.SellingPrice))
                    .ToList();
            }

            await tx.CommitAsync();

            string? categoryName = null;
            if (product.CategoryId.HasValue)
                categoryName = await _db.Categories
                    .Where(c => c.CategoryId == product.CategoryId.Value)
                    .Select(c => c.Name)
                    .FirstOrDefaultAsync();

            return new ProductDto(
                product.ProductId, product.Name, product.CategoryId, categoryName,
                product.Description, product.Image, product.VendorName,
                product.Stock, product.CostPrice, product.SellingPrice,
                product.OnlineAvailable, variationDtos);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<ProductDetailDto?> GetProductDetailAsync(int productId, int shopId)
    {
        var product = await _repo.GetProductByIdAsync(productId, shopId);
        if (product is null) return null;

        // Run both lookups in parallel — no sequential awaits
        var variationsTask = _repo.GetVariationsByProductIdAsync(productId);
        var categoriesTask = _repo.GetCategoriesAsync(shopId);
        await Task.WhenAll(variationsTask, categoriesTask);

        var catMap = categoriesTask.Result.ToDictionary(c => c.CategoryId, c => c.Name);
        return MapProductDetail(product, variationsTask.Result, catMap);
    }

    public async Task<ProductDetailDto> UpdateProductAsync(int productId, int shopId, UpdateProductRequest req)
    {
        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var product = await _repo.GetProductByIdAsync(productId, shopId)
                ?? throw new InvalidOperationException("Product not found.");

            product.Name = req.Name; product.CategoryId = req.CategoryId;
            product.Description = req.Description; product.Image = req.Image;
            product.VendorName = req.VendorName; product.Stock = req.Stock;
            product.CostPrice = req.CostPrice; product.SellingPrice = req.SellingPrice;
            product.OnlineAvailable = req.OnlineAvailable;

            if (req.Variations is { Count: > 0 })
            {
                var existingIds = req.Variations
                    .Where(v => v.VariationId.HasValue)
                    .Select(v => v.VariationId!.Value)
                    .ToList();

                // ONE query, not per-iteration
                var existingMap = existingIds.Count > 0
                    ? (await _db.Variations
                        .Where(v => v.ProductId == productId && existingIds.Contains(v.VariationId))
                        .ToListAsync())
                        .ToDictionary(v => v.VariationId)
                    : new Dictionary<int, Variation>();

                var newVariations = new List<Variation>();

                foreach (var v in req.Variations)
                {
                    if (v.VariationId.HasValue && existingMap.TryGetValue(v.VariationId.Value, out var existing))
                    {
                        // In-memory update — EF change tracking handles the SQL UPDATE
                        existing.Name = v.Name; existing.Image = v.Image;
                        existing.SellingPrice = v.SellingPrice;
                    }
                    else if (!v.VariationId.HasValue)
                    {
                        newVariations.Add(new Variation
                        {
                            ProductId = productId, Name = v.Name,
                            Image = v.Image, SellingPrice = v.SellingPrice
                        });
                    }
                }

                if (newVariations.Count > 0)
                    _db.Variations.AddRange(newVariations);
            }

            // Single SaveChanges covers all changes
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            // parallel
            var variationsTask = _repo.GetVariationsByProductIdAsync(productId);
            var categoriesTask = _repo.GetCategoriesAsync(shopId);
            await Task.WhenAll(variationsTask, categoriesTask);

            var catMap = categoriesTask.Result.ToDictionary(c => c.CategoryId, c => c.Name);
            return MapProductDetail(product, variationsTask.Result, catMap);
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    private static ProductDetailDto MapProductDetail(
        Product product, List<Variation> variations, Dictionary<int, string> catMap) =>
        new(
            product.ProductId, product.Name, product.CategoryId,
            product.CategoryId.HasValue && catMap.TryGetValue(product.CategoryId.Value, out var name) ? name : null,
            product.Description, product.Image, product.VendorName, product.Stock,
            product.CostPrice, product.SellingPrice, product.OnlineAvailable,
            variations.Select(v =>
                new VariationDetailDto(v.VariationId, v.Name, v.Image, v.SellingPrice)).ToList()
        );
}

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

    public InventoryService(IInventoryRepository repo) => _repo = repo;

    public async Task<List<CategoryDto>> GetCategoriesAsync(int shopId)
    {
        var cats = await _repo.GetCategoriesAsync(shopId);
        return cats.Select(c => new CategoryDto(c.CategoryId, c.Name)).ToList();
    }

    public async Task<List<ProductListItemDto>> GetProductsAsync(int shopId, string? search)
    {
        var products   = await _repo.GetProductsAsync(shopId, search);
        var categories = await _repo.GetCategoriesAsync(shopId);
        var catMap     = categories.ToDictionary(c => c.CategoryId, c => c.Name);

        return products.Select(p => new ProductListItemDto(
            p.ProductId, p.Name, p.VendorName, p.Stock,
            p.CategoryId.HasValue && catMap.ContainsKey(p.CategoryId.Value)
                ? catMap[p.CategoryId.Value] : null
        )).ToList();
    }

    public async Task<ProductDto> CreateProductAsync(int shopId, CreateProductRequest req)
    {
        var product = new Product
        {
            ShopId          = shopId,
            CategoryId      = req.CategoryId,
            Name            = req.Name,
            Description     = req.Description,
            VendorName      = req.VendorName,
            Stock           = req.Stock,
            CostPrice       = req.CostPrice,
            SellingPrice    = req.SellingPrice,
            OnlineAvailable = req.OnlineAvailable,
            DateAdded       = DateTime.UtcNow
        };
        await _repo.CreateProductAsync(product);

        var variationDtos = new List<VariationDto>();
        if (req.Variations is { Count: > 0 })
        {
            foreach (var v in req.Variations)
            {
                var variation = new Variation { ProductId = product.ProductId, Name = v.Name, SellingPrice = v.SellingPrice };
                await _repo.CreateVariationAsync(variation);
                variationDtos.Add(new VariationDto(variation.VariationId, variation.Name, variation.SellingPrice));
            }
        }

        string? categoryName = null;
        if (product.CategoryId.HasValue)
        {
            var cats = await _repo.GetCategoriesAsync(shopId);
            categoryName = cats.FirstOrDefault(c => c.CategoryId == product.CategoryId)?.Name;
        }

        return new ProductDto(
            product.ProductId, product.Name, product.CategoryId, categoryName,
            product.Description, product.Image, product.VendorName,
            product.Stock, product.CostPrice, product.SellingPrice,
            product.OnlineAvailable, variationDtos
        );
    }

    public async Task<ProductDetailDto?> GetProductDetailAsync(int productId, int shopId)
    {
        var product = await _repo.GetProductByIdAsync(productId, shopId);
        if (product is null) return null;

        var variations = await _repo.GetVariationsByProductIdAsync(productId);
        var categories = await _repo.GetCategoriesAsync(shopId);
        var catMap     = categories.ToDictionary(c => c.CategoryId, c => c.Name);

        return MapProductDetail(product, variations, catMap);
    }

    public async Task<ProductDetailDto> UpdateProductAsync(int productId, int shopId, UpdateProductRequest req)
    {
        var product = await _repo.GetProductByIdAsync(productId, shopId)
            ?? throw new InvalidOperationException("Product not found.");

        product.Name            = req.Name;
        product.CategoryId      = req.CategoryId;
        product.Description     = req.Description;
        product.Image           = req.Image;
        product.VendorName      = req.VendorName;
        product.Stock           = req.Stock;
        product.CostPrice       = req.CostPrice;
        product.SellingPrice    = req.SellingPrice;
        product.OnlineAvailable = req.OnlineAvailable;
        await _repo.SaveChangesAsync();

        // Handle variations — upsert
        if (req.Variations is not null)
        {
            foreach (var v in req.Variations)
            {
                if (v.VariationId.HasValue)
                {
                    var existing = await _repo.GetVariationByIdAsync(v.VariationId.Value, productId);
                    if (existing is not null)
                    {
                        existing.Name         = v.Name;
                        existing.Image        = v.Image;
                        existing.SellingPrice = v.SellingPrice;
                    }
                }
                else
                {
                    await _repo.CreateVariationAsync(new Variation
                    {
                        ProductId    = productId,
                        Name         = v.Name,
                        Image        = v.Image,
                        SellingPrice = v.SellingPrice
                    });
                }
            }
            await _repo.SaveChangesAsync();
        }

        var updatedVariations = await _repo.GetVariationsByProductIdAsync(productId);
        var categories        = await _repo.GetCategoriesAsync(shopId);
        var catMap            = categories.ToDictionary(c => c.CategoryId, c => c.Name);

        return MapProductDetail(product, updatedVariations, catMap);
    }

    private static ProductDetailDto MapProductDetail(
        Product product,
        List<Variation> variations,
        Dictionary<int, string> catMap) =>
        new(
            product.ProductId,
            product.Name,
            product.CategoryId,
            product.CategoryId.HasValue && catMap.ContainsKey(product.CategoryId.Value)
                ? catMap[product.CategoryId.Value] : null,
            product.Description,
            product.Image,
            product.VendorName,
            product.Stock,
            product.CostPrice,
            product.SellingPrice,
            product.OnlineAvailable,
            variations.Select(v => new VariationDetailDto(v.VariationId, v.Name, v.Image, v.SellingPrice)).ToList()
        );
}

using PasalE.Api.DTOs;
using PasalE.Api.Models;
using PasalE.Api.Repositories;

namespace PasalE.Api.Services;

public interface IInventoryService
{
    Task<List<CategoryDto>>      GetCategoriesAsync(int shopId);
    Task<List<ProductListItemDto>> GetProductsAsync(int shopId, string? search);
    Task<ProductDto>             CreateProductAsync(int shopId, CreateProductRequest req);
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
            p.ProductId,
            p.Name,
            p.VendorName,
            p.Stock,
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
            OnlineAvailable = req.OnlineAvailable
        };

        await _repo.CreateProductAsync(product);

        var variationDtos = new List<VariationDto>();

        if (req.Variations is { Count: > 0 })
        {
            foreach (var v in req.Variations)
            {
                var variation = new Variation
                {
                    ProductId    = product.ProductId,
                    Name         = v.Name,
                    SellingPrice = v.SellingPrice
                };
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
}
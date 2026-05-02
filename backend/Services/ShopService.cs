using PasalE.Api.DTOs;
using PasalE.Api.Models;
using PasalE.Api.Repositories;

namespace PasalE.Api.Services;

public interface IShopService
{
    Task<ShopInfoDto?>        GetShopInfoAsync(int ownerId);
    Task<ShopInfoDto>         UpdateShopAsync(int ownerId, UpdateShopRequest req);
    Task<List<CategoryDetailDto>> GetCategoriesAsync(int shopId);
    Task<CategoryDetailDto>   AddCategoryAsync(int shopId, CreateCategoryRequest req);
    Task                      DeleteCategoryAsync(int categoryId, int shopId);
}

public class ShopService : IShopService
{
    private readonly IShopRepository     _shops;
    private readonly ICategoryRepository _categories;

    public ShopService(IShopRepository shops, ICategoryRepository categories)
    {
        _shops      = shops;
        _categories = categories;
    }

    public async Task<ShopInfoDto?> GetShopInfoAsync(int ownerId)
    {
        var shop = await _shops.GetByOwnerIdAsync(ownerId);
        return shop is null ? null : MapShop(shop);
    }

    public async Task<ShopInfoDto> UpdateShopAsync(int ownerId, UpdateShopRequest req)
    {
        var shop = await _shops.GetByOwnerIdAsync(ownerId)
            ?? throw new InvalidOperationException("Shop not found.");

        if (req.BrandName is not null)
        {
            shop.BrandName = req.BrandName;
            shop.ShopName  = req.BrandName; // keep in sync
        }
        if (req.PhysicalLocation is not null) shop.PhysicalLocation = req.PhysicalLocation;
        if (req.Theme            is not null) shop.Theme            = req.Theme;
        if (req.Colour           is not null) shop.Colour           = req.Colour;
        if (req.LogoImage        is not null) shop.LogoImage        = req.LogoImage;
        if (req.BannerImage      is not null) shop.BannerImage      = req.BannerImage;

        await _shops.SaveChangesAsync();
        return MapShop(shop);
    }

    public async Task<List<CategoryDetailDto>> GetCategoriesAsync(int shopId)
    {
        var cats = await _categories.GetByShopIdAsync(shopId);
        return cats.Select(c => new CategoryDetailDto(c.CategoryId, c.Name, c.Image)).ToList();
    }

    public async Task<CategoryDetailDto> AddCategoryAsync(int shopId, CreateCategoryRequest req)
    {
        var cat = new Category { ShopId = shopId, Name = req.Name, Image = req.Image };
        await _categories.CreateAsync(cat);
        return new CategoryDetailDto(cat.CategoryId, cat.Name, cat.Image);
    }

    public async Task DeleteCategoryAsync(int categoryId, int shopId)
    {
        var cat = await _categories.GetByIdAsync(categoryId, shopId)
            ?? throw new InvalidOperationException("Category not found.");
        await _categories.DeleteAsync(cat);
    }

    private static ShopInfoDto MapShop(Shop s) => new(
        s.ShopId, s.ShopName, s.BrandName, s.PhysicalLocation,
        s.Subdomain, s.SubdomainStatus, s.Theme, s.Colour, s.LogoImage, s.BannerImage
    );
}

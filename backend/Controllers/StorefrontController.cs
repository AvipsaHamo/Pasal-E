using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/storefront")]
public class StorefrontController : ControllerBase
{
    private readonly AppDbContext _db;
    public StorefrontController(AppDbContext db) => _db = db;

    private async Task<int?> GetApprovedShopIdAsync(string subdomain)
    {
        var shop = await _db.Shops.FirstOrDefaultAsync(s =>
            s.Subdomain == subdomain.ToLower() && s.SubdomainStatus == "approved");
        return shop?.ShopId;
    }

    // GET api/storefront/{subdomain}
    [HttpGet("{subdomain}")]
    public async Task<IActionResult> GetShop(string subdomain)
    {
        var shop = await _db.Shops.FirstOrDefaultAsync(s =>
            s.Subdomain == subdomain.ToLower() && s.SubdomainStatus == "approved");
        if (shop is null) return NotFound(new { message = "Shop not found or not yet approved." });

        return Ok(new {
            shopId    = shop.ShopId,
            shopName  = shop.ShopName,
            brandName = shop.BrandName,
            logoImage = shop.LogoImage,
            bannerImage = shop.BannerImage,
            theme     = shop.Theme ?? "Light",
            colour    = shop.Colour ?? "Green"
        });
    }

    // GET api/storefront/{subdomain}/featured
    [HttpGet("{subdomain}/featured")]
    public async Task<IActionResult> GetFeatured(string subdomain)
    {
        var shopId = await GetApprovedShopIdAsync(subdomain);
        if (shopId is null) return NotFound();

        var featured = await _db.FeaturedProducts
            .Where(f => f.ShopId == shopId)
            .Join(_db.Products,
                  f => f.ProductId,
                  p => p.ProductId,
                  (f, p) => new {
                      p.ProductId, p.Name, p.Image,
                      p.SellingPrice, f.SortOrder,
                      variations = _db.Variations
                          .Where(v => v.ProductId == p.ProductId)
                          .Select(v => new { v.VariationId, v.Name, v.SellingPrice })
                          .ToList()
                  })
            .OrderBy(f => f.SortOrder)
            .ToListAsync();

        return Ok(featured);
    }

    // GET api/storefront/{subdomain}/categories
    [HttpGet("{subdomain}/categories")]
    public async Task<IActionResult> GetCategories(string subdomain)
    {
        var shopId = await GetApprovedShopIdAsync(subdomain);
        if (shopId is null) return NotFound();

        var cats = await _db.Categories
            .Where(c => c.ShopId == shopId)
            .Select(c => new { c.CategoryId, c.Name, c.Image })
            .ToListAsync();

        return Ok(cats);
    }

    // GET api/storefront/{subdomain}/products?categoryId=&search=
    [HttpGet("{subdomain}/products")]
    public async Task<IActionResult> GetProducts(
        string subdomain,
        [FromQuery] int? categoryId,
        [FromQuery] string? search)
    {
        var shopId = await GetApprovedShopIdAsync(subdomain);
        if (shopId is null) return NotFound();

        var q = _db.Products.Where(p => p.ShopId == shopId && p.OnlineAvailable);
        if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId);
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Name.ToLower().Contains(search.ToLower()));

        var products = await q
            .OrderByDescending(p => p.DateAdded)
            .Select(p => new {
                p.ProductId, p.Name, p.Description, p.Image,
                p.SellingPrice, p.Stock,
                variations = _db.Variations
                    .Where(v => v.ProductId == p.ProductId)
                    .Select(v => new { v.VariationId, v.Name, v.SellingPrice })
                    .ToList()
            })
            .ToListAsync();

        return Ok(products);
    }
}

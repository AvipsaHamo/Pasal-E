using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;

namespace PasalE.Api.Controllers;

/// <summary>
/// Public storefront API — no auth required.
/// Only serves data for shops whose subdomain_status = 'approved'.
/// Called by customer-frontend on page load.
/// </summary>
[ApiController]
[Route("api/storefront")]
public class StorefrontController : ControllerBase
{
    private readonly AppDbContext _db;
    public StorefrontController(AppDbContext db) => _db = db;

    // GET api/storefront/{subdomain}
    // Returns basic shop info for the resolved subdomain.
    // Returns 404 if subdomain doesn't exist or is not approved.
    [HttpGet("{subdomain}")]
    public async Task<IActionResult> GetShopBySubdomain(string subdomain)
    {
        var shop = await _db.Shops
            .FirstOrDefaultAsync(s =>
                s.Subdomain == subdomain.ToLower() &&
                s.SubdomainStatus == "approved");

        if (shop is null)
            return NotFound(new { message = "Shop not found or not yet approved." });

        return Ok(new
        {
            shopId    = shop.ShopId,
            shopName  = shop.ShopName,
            brandName = shop.BrandName,
            logoImage = shop.LogoImage,
            theme     = shop.Theme,
            colour    = shop.Colour
        });
    }

    // GET api/storefront/{subdomain}/categories
    [HttpGet("{subdomain}/categories")]
    public async Task<IActionResult> GetCategories(string subdomain)
    {
        var shop = await _db.Shops
            .FirstOrDefaultAsync(s =>
                s.Subdomain == subdomain.ToLower() &&
                s.SubdomainStatus == "approved");

        if (shop is null) return NotFound();

        var categories = await _db.Categories
            .Where(c => c.ShopId == shop.ShopId)
            .Select(c => new { c.CategoryId, c.Name, c.Image })
            .ToListAsync();

        return Ok(categories);
    }

    // GET api/storefront/{subdomain}/products?categoryId=&search=
    [HttpGet("{subdomain}/products")]
    public async Task<IActionResult> GetProducts(
        string subdomain,
        [FromQuery] int? categoryId,
        [FromQuery] string? search)
    {
        var shop = await _db.Shops
            .FirstOrDefaultAsync(s =>
                s.Subdomain == subdomain.ToLower() &&
                s.SubdomainStatus == "approved");

        if (shop is null) return NotFound();

        var q = _db.Products
            .Where(p => p.ShopId == shop.ShopId && p.OnlineAvailable);

        if (categoryId.HasValue)
            q = q.Where(p => p.CategoryId == categoryId);

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(p => p.Name.ToLower().Contains(search.ToLower()));

        var products = await q
            .Select(p => new
            {
                p.ProductId,
                p.Name,
                p.Description,
                p.Image,
                p.SellingPrice,
                p.Stock,
                variations = _db.Variations
                    .Where(v => v.ProductId == p.ProductId)
                    .Select(v => new { v.VariationId, v.Name, v.SellingPrice })
                    .ToList()
            })
            .ToListAsync();

        return Ok(products);
    }
}

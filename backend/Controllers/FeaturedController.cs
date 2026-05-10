using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.DTOs;
using PasalE.Api.Models;
using PasalE.Api.Repositories;

namespace PasalE.Api.Controllers;

// ── Owner: manage featured products ─────────────────────────────────────
[ApiController]
[Route("api/shop/featured")]
[Authorize]
public class FeaturedController : ControllerBase
{
    private readonly AppDbContext    _db;
    private readonly IShopRepository _shops;

    public FeaturedController(AppDbContext db, IShopRepository shops)
    {
        _db    = db;
        _shops = shops;
    }

    private async Task<int?> GetShopIdAsync()
    {
        var claim = User.FindFirst("sub")?.Value;
        if (claim is null || !int.TryParse(claim, out var ownerId)) return null;
        var shop = await _shops.GetByOwnerIdAsync(ownerId);
        return shop?.ShopId;
    }

    // GET api/shop/featured
    [HttpGet]
    public async Task<IActionResult> GetFeatured()
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();

        var featured = await _db.FeaturedProducts
            .Where(f => f.ShopId == shopId)
            .Join(_db.Products,
                  f => f.ProductId,
                  p => p.ProductId,
                  (f, p) => new
                  {
                      f.FeaturedId,
                      p.ProductId,
                      p.Name,
                      p.Image,
                      p.SellingPrice,
                      f.SortOrder
                  })
            .OrderBy(x => x.SortOrder)
            .Select(x => new FeaturedProductDto(
                x.FeaturedId,
                x.ProductId,
                x.Name,
                x.Image,
                x.SellingPrice,
                x.SortOrder))
            .ToListAsync();

        return Ok(featured);
    }

    // POST api/shop/featured
    [HttpPost]
    public async Task<IActionResult> AddFeatured([FromBody] AddFeaturedProductRequest req)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();

        // Verify product belongs to this shop
        var product = await _db.Products
            .FirstOrDefaultAsync(p => p.ProductId == req.ProductId && p.ShopId == shopId);
        if (product is null)
            return BadRequest(new { message = "Product not found in this shop." });

        // Check duplicate
        var exists = await _db.FeaturedProducts
            .AnyAsync(f => f.ShopId == shopId && f.ProductId == req.ProductId);
        if (exists)
            return BadRequest(new { message = "Product is already featured." });

        var featured = new FeaturedProduct
        {
            ShopId    = shopId.Value,
            ProductId = req.ProductId,
            SortOrder = req.SortOrder
        };
        _db.FeaturedProducts.Add(featured);
        await _db.SaveChangesAsync();

        return Ok(new FeaturedProductDto(
            featured.FeaturedId, product.ProductId, product.Name,
            product.Image, product.SellingPrice, featured.SortOrder));
    }

    // DELETE api/shop/featured/{featuredId}
    [HttpDelete("{featuredId:int}")]
    public async Task<IActionResult> RemoveFeatured(int featuredId)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();

        var featured = await _db.FeaturedProducts
            .FirstOrDefaultAsync(f => f.FeaturedId == featuredId && f.ShopId == shopId);
        if (featured is null) return NotFound();

        _db.FeaturedProducts.Remove(featured);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Removed from featured." });
    }
}

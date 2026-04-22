using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.DTOs;
using PasalE.Api.Repositories;
using PasalE.Api.Services;
using System.Security.Claims;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventory;
    private readonly IShopRepository   _shops;

    public InventoryController(IInventoryService inventory, IShopRepository shops)
    {
        _inventory = inventory;
        _shops     = shops;
    }

    private async Task<int?> GetShopIdAsync()
    {
        var ownerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue("sub");
        if (ownerIdClaim is null || !int.TryParse(ownerIdClaim, out var ownerId)) return null;
        var shop = await _shops.GetByOwnerIdAsync(ownerId);
        return shop?.ShopId;
    }

    // GET api/inventory/categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        return Ok(await _inventory.GetCategoriesAsync(shopId.Value));
    }

    // GET api/inventory/products?search=
    [HttpGet("products")]
    public async Task<IActionResult> GetProducts([FromQuery] string? search)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        return Ok(await _inventory.GetProductsAsync(shopId.Value, search));
    }

    // POST api/inventory/products
    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        return Ok(await _inventory.CreateProductAsync(shopId.Value, req));
    }

    // GET api/inventory/products/{id}
    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProduct(int id)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var product = await _inventory.GetProductDetailAsync(id, shopId.Value);
        if (product is null) return NotFound();
        return Ok(product);
    }

    // PUT api/inventory/products/{id}
    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var product = await _inventory.UpdateProductAsync(id, shopId.Value, req);
        return Ok(product);
    }
}

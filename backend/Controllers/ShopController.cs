using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.DTOs;
using PasalE.Api.Services;
using System.Security.Claims;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/shop")]
[Authorize]
public class ShopController : ControllerBase
{
    private readonly IShopService _shopSvc;

    public ShopController(IShopService shopSvc) => _shopSvc = shopSvc;

    private int? GetOwnerId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? User.FindFirstValue("sub");
        return claim is not null && int.TryParse(claim, out var id) ? id : null;
    }

    // GET api/shop
    [HttpGet]
    public async Task<IActionResult> GetShop()
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var shop = await _shopSvc.GetShopInfoAsync(ownerId.Value);
        if (shop is null) return NotFound();
        return Ok(shop);
    }

    // PATCH api/shop
    [HttpPatch]
    public async Task<IActionResult> UpdateShop([FromBody] UpdateShopRequest req)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var shop = await _shopSvc.UpdateShopAsync(ownerId.Value, req);
        return Ok(shop);
    }

    // GET api/shop/categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var shop = await _shopSvc.GetShopInfoAsync(ownerId.Value);
        if (shop is null) return NotFound();
        return Ok(await _shopSvc.GetCategoriesAsync(shop.ShopId));
    }

    // POST api/shop/categories
    [HttpPost("categories")]
    public async Task<IActionResult> AddCategory([FromBody] CreateCategoryRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var shop = await _shopSvc.GetShopInfoAsync(ownerId.Value);
        if (shop is null) return NotFound();
        var cat = await _shopSvc.AddCategoryAsync(shop.ShopId, req);
        return Ok(cat);
    }

    // DELETE api/shop/categories/{id}
    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var ownerId = GetOwnerId();
        if (ownerId is null) return Unauthorized();
        var shop = await _shopSvc.GetShopInfoAsync(ownerId.Value);
        if (shop is null) return NotFound();
        await _shopSvc.DeleteCategoryAsync(id, shop.ShopId);
        return Ok(new { message = "Category deleted." });
    }
}

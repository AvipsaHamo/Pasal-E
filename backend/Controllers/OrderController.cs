using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.DTOs;
using PasalE.Api.Repositories;
using PasalE.Api.Services;
using System.Security.Claims;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService   _orders;
    private readonly IShopRepository _shops;

    public OrderController(IOrderService orders, IShopRepository shops)
    {
        _orders = orders;
        _shops  = shops;
    }

    private async Task<int?> GetShopIdAsync()
    {
        var ownerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue("sub");
        if (ownerIdClaim is null || !int.TryParse(ownerIdClaim, out var ownerId)) return null;
        var shop = await _shops.GetByOwnerIdAsync(ownerId);
        return shop?.ShopId;
    }

    // GET api/orders?status=Pending&search=reepa
    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] string? status, [FromQuery] string? search)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var orders = await _orders.GetOrdersAsync(shopId.Value, status, search);
        return Ok(orders);
    }

    // GET api/orders/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var order = await _orders.GetOrderFullAsync(id, shopId.Value);
        if (order is null) return NotFound();
        return Ok(order);
    }

    // PATCH api/orders/{id}/status
    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusRequest req)
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        await _orders.UpdateStatusAsync(id, shopId.Value, req.Status);
        return Ok(new { message = "Status updated." });
    }
}

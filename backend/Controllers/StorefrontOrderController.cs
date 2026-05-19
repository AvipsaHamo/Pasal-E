using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace PasalE.Api.Controllers;

public record PlaceOrderRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required] string Phone,
    string? Email,
    [Required] string Address,
    string? Landmark,
    [Required] string PaymentType,
    [Required] List<OrderLineRequest> Items
);

public record OrderLineRequest(
    int      ProductId,
    int?     VariationId,
    int      Quantity,
    decimal  Price,
    string   ProductName,
    string?  VariationName
);

[ApiController]
[Route("api/storefront")]
public class StorefrontOrderController : ControllerBase
{
    private readonly AppDbContext _db;
    public StorefrontOrderController(AppDbContext db) => _db = db;

    // POST api/storefront/{subdomain}/orders
    [HttpPost("{subdomain}/orders")]
    public async Task<IActionResult> PlaceOrder(string subdomain, [FromBody] PlaceOrderRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var shop = await _db.Shops
            .FirstOrDefaultAsync(s =>
                s.Subdomain == subdomain.ToLower() &&
                s.SubdomainStatus == "approved");
        if (shop is null) return NotFound(new { message = "Shop not found." });

        // Find or create customer by phone (primary identifier since no login)
        var customer = await _db.Customers
            .FirstOrDefaultAsync(c => c.Phone == req.Phone);

        if (customer is null)
        {
            customer = new Customer
            {
                FirstName = req.FirstName,
                LastName  = req.LastName,
                Phone     = req.Phone,
                Email     = req.Email,
                Address   = req.Address,
                Landmark  = req.Landmark,
                CreatedAt = DateTime.UtcNow
            };
            _db.Customers.Add(customer);
            await _db.SaveChangesAsync();
        }

        var totalAmount = req.Items.Sum(i => i.Price * i.Quantity);

        var order = new Order
        {
            CustomerId   = customer.CustomerId,
            ShopId       = shop.ShopId,
            OrderDate    = DateTime.UtcNow,
            TotalAmount  = totalAmount,
            PaymentType  = req.PaymentType,
            Status       = "Pending"
        };
        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var details = req.Items.Select(i => new OrderDetail
        {
            OrderId       = order.OrderId,
            ProductId     = i.ProductId,
            VariationId   = i.VariationId,
            Quantity      = i.Quantity,
            Price         = i.Price,
            ProductName   = i.ProductName,
            VariationName = i.VariationName
        }).ToList();

        _db.OrderDetails.AddRange(details);
        await _db.SaveChangesAsync();

        return Ok(new { orderId = order.OrderId, message = "Order placed successfully." });
    }
}

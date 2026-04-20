using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.Models;

namespace PasalE.Api.Repositories;

public interface IOrderRepository
{
    Task<List<Order>>       GetOrdersAsync(int shopId, string? status, string? customerSearch);
    Task<Order?>            GetByIdAsync(int orderId, int shopId);
    Task<Customer?>         GetCustomerAsync(int customerId);
    Task<List<OrderDetail>> GetDetailsAsync(int orderId);
    Task                    UpdateStatusAsync(int orderId, string status);
}

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;
    public OrderRepository(AppDbContext db) => _db = db;

    public async Task<List<Order>> GetOrdersAsync(int shopId, string? status, string? customerSearch)
    {
        var q = _db.Orders.Where(o => o.ShopId == shopId);

        if (!string.IsNullOrWhiteSpace(status))
            q = q.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(customerSearch))
        {
            // Join to customer to filter by name
            var matchingCustomerIds = await _db.Customers
                .Where(c => (c.FirstName + " " + c.LastName)
                    .ToLower().Contains(customerSearch.ToLower()))
                .Select(c => c.CustomerId)
                .ToListAsync();
            q = q.Where(o => o.CustomerId.HasValue && matchingCustomerIds.Contains(o.CustomerId.Value));
        }

        // Sort: Pending → In Progress → Delivered → Dismissed
        var statusOrder = new[] { "Pending", "In Progress", "Delivered", "Dismissed" };
        var all = await q.ToListAsync();

        return all
            .OrderBy(o => Array.IndexOf(statusOrder, o.Status) == -1
                ? 99 : Array.IndexOf(statusOrder, o.Status))
            .ThenByDescending(o => o.OrderDate)
            .ToList();
    }

    public Task<Order?> GetByIdAsync(int orderId, int shopId) =>
        _db.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId && o.ShopId == shopId);

    public Task<Customer?> GetCustomerAsync(int customerId) =>
        _db.Customers.FindAsync(customerId).AsTask();

    public Task<List<OrderDetail>> GetDetailsAsync(int orderId) =>
        _db.OrderDetails.Where(od => od.OrderId == orderId).ToListAsync();

    public async Task UpdateStatusAsync(int orderId, string status)
    {
        var order = await _db.Orders.FindAsync(orderId);
        if (order is null) return;
        order.Status = status;
        await _db.SaveChangesAsync();
    }
}

using PasalE.Api.DTOs;
using PasalE.Api.Repositories;

namespace PasalE.Api.Services;

public interface IOrderService
{
    Task<List<OrderListItemDto>> GetOrdersAsync(int shopId, string? status, string? search);
    Task<OrderFullDto?>          GetOrderFullAsync(int orderId, int shopId);
    Task                         UpdateStatusAsync(int orderId, int shopId, string status);
}

public class OrderService : IOrderService
{
    private readonly IOrderRepository _repo;
    public OrderService(IOrderRepository repo) => _repo = repo;

    public async Task<List<OrderListItemDto>> GetOrdersAsync(int shopId, string? status, string? search)
    {
        var orders = await _repo.GetOrdersAsync(shopId, status, search);
        var result = new List<OrderListItemDto>();

        foreach (var o in orders)
        {
            string customerName = "Unknown";
            string? phone       = null;

            if (o.CustomerId.HasValue)
            {
                var c = await _repo.GetCustomerAsync(o.CustomerId.Value);
                if (c is not null)
                {
                    customerName = $"{c.FirstName} {c.LastName}";
                    phone        = c.Phone;
                }
            }

            result.Add(new OrderListItemDto(
                o.OrderId,
                customerName,
                phone,
                o.OrderDate.ToString("yyyy-MM-dd"),
                o.Status
            ));
        }
        return result;
    }

    public async Task<OrderFullDto?> GetOrderFullAsync(int orderId, int shopId)
    {
        var order = await _repo.GetByIdAsync(orderId, shopId);
        if (order is null) return null;

        string  customerName = "Unknown";
        string? phone = null, email = null, address = null, landmark = null;

        if (order.CustomerId.HasValue)
        {
            var c = await _repo.GetCustomerAsync(order.CustomerId.Value);
            if (c is not null)
            {
                customerName = $"{c.FirstName} {c.LastName}";
                phone        = c.Phone;
                email        = c.Email;
                address      = c.Address;
                landmark     = c.Landmark;
            }
        }

        var details = await _repo.GetDetailsAsync(orderId);
        var detailDtos = details.Select(d => new OrderDetailLineDto(
            d.ProductId,
            d.ProductName,
            d.VariationName,
            d.Quantity,
            d.Price
        )).ToList();

        // Legacy fallback: older orders may only store total_amount without line rows.
        if (detailDtos.Count == 0 && order.TotalAmount.HasValue)
        {
            detailDtos.Add(new OrderDetailLineDto(
                ProductId: null,
                ProductName: "Legacy order item",
                VariationName: null,
                Quantity: 1,
                Price: order.TotalAmount
            ));
        }

        return new OrderFullDto(
            order.OrderId, customerName, phone, email, address, landmark,
            order.OrderDate.ToString("yyyy-MM-dd"),
            order.Status, order.TotalAmount, detailDtos
        );
    }

    public async Task UpdateStatusAsync(int orderId, int shopId, string status)
    {
        var allowed = new[] { "Pending", "In Progress", "Delivered", "Dismissed" };
        if (!allowed.Contains(status))
            throw new InvalidOperationException($"Invalid status: {status}");

        var order = await _repo.GetByIdAsync(orderId, shopId);
        if (order is null)
            throw new InvalidOperationException("Order not found.");

        await _repo.UpdateStatusAsync(orderId, status);
    }
}

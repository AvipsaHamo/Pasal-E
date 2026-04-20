using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.DTOs;

namespace PasalE.Api.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(int shopId, string period);
    Task<ChartDataDto>        GetChartDataAsync(int shopId, int year, int month);
    Task<AvailableYearsDto>   GetAvailableYearsAsync(int shopId);
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    public DashboardService(AppDbContext db) => _db = db;

    public async Task<DashboardSummaryDto> GetSummaryAsync(int shopId, string period)
    {
        var now = DateTime.UtcNow;

        DateTime currentStart, currentEnd, previousStart, previousEnd;

        if (period == "year")
        {
            currentStart  = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            currentEnd    = now;
            previousStart = new DateTime(now.Year - 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            previousEnd   = new DateTime(now.Year - 1, now.Month, DateTime.DaysInMonth(now.Year - 1, now.Month), 23, 59, 59, DateTimeKind.Utc);
        }
        else // month (default)
        {
            currentStart  = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            currentEnd    = now;
            var prevMonth = now.AddMonths(-1);
            previousStart = new DateTime(prevMonth.Year, prevMonth.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            previousEnd   = new DateTime(prevMonth.Year, prevMonth.Month,
                                DateTime.DaysInMonth(prevMonth.Year, prevMonth.Month), 23, 59, 59, DateTimeKind.Utc);
        }

        var orders = _db.Orders.Where(o => o.ShopId == shopId);

        // ── Revenue ──────────────────────────────────────────────────────
        var currentRevenue  = await orders
            .Where(o => o.OrderDate >= currentStart && o.OrderDate <= currentEnd)
            .SumAsync(o => (decimal?)(o.TotalAmount ?? 0)) ?? 0;

        var previousRevenue = await orders
            .Where(o => o.OrderDate >= previousStart && o.OrderDate <= previousEnd)
            .SumAsync(o => (decimal?)(o.TotalAmount ?? 0)) ?? 0;

        // ── Unique customers ─────────────────────────────────────────────
        var currentCustomers = await orders
            .Where(o => o.OrderDate >= currentStart && o.OrderDate <= currentEnd && o.CustomerId != null)
            .Select(o => o.CustomerId)
            .Distinct()
            .CountAsync();

        var previousCustomers = await orders
            .Where(o => o.OrderDate >= previousStart && o.OrderDate <= previousEnd && o.CustomerId != null)
            .Select(o => o.CustomerId)
            .Distinct()
            .CountAsync();

        // ── Total orders ─────────────────────────────────────────────────
        var currentOrderCount  = await orders
            .Where(o => o.OrderDate >= currentStart && o.OrderDate <= currentEnd)
            .CountAsync();

        var previousOrderCount = await orders
            .Where(o => o.OrderDate >= previousStart && o.OrderDate <= previousEnd)
            .CountAsync();

        return new DashboardSummaryDto(
            Revenue:        currentRevenue,
            RevenueDelta:   currentRevenue - previousRevenue,
            TotalCustomers: currentCustomers,
            CustomersDelta: currentCustomers - previousCustomers,
            TotalOrders:    currentOrderCount,
            OrdersDelta:    currentOrderCount - previousOrderCount,
            Period:         period
        );
    }

    public async Task<ChartDataDto> GetChartDataAsync(int shopId, int year, int month)
    {
        // Income: sum of order total_amount grouped by day within the selected month
        var monthStart = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd   = monthStart.AddMonths(1).AddTicks(-1);
        int daysInMonth = DateTime.DaysInMonth(year, month);

        // Income per day
        var incomeRaw = await _db.Orders
            .Where(o => o.ShopId == shopId && o.OrderDate >= monthStart && o.OrderDate <= monthEnd)
            .GroupBy(o => o.OrderDate.Day)
            .Select(g => new { Day = g.Key, Total = g.Sum(o => o.TotalAmount ?? 0) })
            .ToListAsync();

        // Expense per day: cost_price * stock from products added that day
        var expenseRaw = await _db.Products
            .Where(p => p.ShopId == shopId && p.DateAdded >= monthStart && p.DateAdded <= monthEnd)
            .GroupBy(p => p.DateAdded.Day)
            .Select(g => new { Day = g.Key, Total = g.Sum(p => (p.CostPrice ?? 0) * p.Stock) })
            .ToListAsync();

        var incomeLookup  = incomeRaw.ToDictionary(x => x.Day, x => x.Total);
        var expenseLookup = expenseRaw.ToDictionary(x => x.Day, x => x.Total);

        // Build a point per day — only include days that have data to keep chart clean
        // But always produce all days for full line chart
        var points = Enumerable.Range(1, daysInMonth).Select(day => new ChartPointDto(
            Label:   $"{day}",
            Income:  incomeLookup.TryGetValue(day, out var inc) ? inc : 0,
            Expense: expenseLookup.TryGetValue(day, out var exp) ? exp : 0
        )).ToList();

        return new ChartDataDto(year, month, points);
    }

    public async Task<AvailableYearsDto> GetAvailableYearsAsync(int shopId)
    {
        // Get years from orders and products combined
        var orderYears = await _db.Orders
            .Where(o => o.ShopId == shopId)
            .Select(o => o.OrderDate.Year)
            .Distinct()
            .ToListAsync();

        var productYears = await _db.Products
            .Where(p => p.ShopId == shopId)
            .Select(p => p.DateAdded.Year)
            .Distinct()
            .ToListAsync();

        var years = orderYears.Union(productYears)
            .Union(new[] { DateTime.UtcNow.Year }) // always include current year
            .OrderBy(y => y)
            .ToList();

        return new AvailableYearsDto(years);
    }
}

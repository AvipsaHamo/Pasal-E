using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.Repositories;
using PasalE.Api.Services;
using System.Security.Claims;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboard;
    private readonly IShopRepository   _shops;

    public DashboardController(IDashboardService dashboard, IShopRepository shops)
    {
        _dashboard = dashboard;
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

    // GET api/dashboard/summary?period=month|year
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] string period = "month")
    {
        if (period != "month" && period != "year") period = "month";
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var summary = await _dashboard.GetSummaryAsync(shopId.Value, period);
        return Ok(summary);
    }

    // GET api/dashboard/chart?year=2025&month=3
    [HttpGet("chart")]
    public async Task<IActionResult> GetChart([FromQuery] int year, [FromQuery] int month)
    {
        if (year < 2020 || year > 2100) year = DateTime.UtcNow.Year;
        if (month < 1 || month > 12) month = DateTime.UtcNow.Month;
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var chart = await _dashboard.GetChartDataAsync(shopId.Value, year, month);
        return Ok(chart);
    }

    // GET api/dashboard/years
    [HttpGet("years")]
    public async Task<IActionResult> GetYears()
    {
        var shopId = await GetShopIdAsync();
        if (shopId is null) return Unauthorized();
        var years = await _dashboard.GetAvailableYearsAsync(shopId.Value);
        return Ok(years);
    }
}

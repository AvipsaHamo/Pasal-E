using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.DTOs;
using PasalE.Api.Services;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;
    public AdminController(IAdminService admin) => _admin = admin;

    // POST api/admin/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AdminLoginRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _admin.LoginAsync(req);
        return Ok(result);
    }

    // GET api/admin/shops
    [HttpGet("shops")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> GetShops()
    {
        var shops = await _admin.GetAllShopsAsync();
        return Ok(shops);
    }

    // PATCH api/admin/shops/{shopId}/subdomain-status
    [HttpPatch("shops/{shopId:int}/subdomain-status")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateStatus(int shopId, [FromBody] UpdateSubdomainStatusRequest req)
    {
        var shop = await _admin.UpdateSubdomainStatusAsync(shopId, req.Status);
        return Ok(shop);
    }
}

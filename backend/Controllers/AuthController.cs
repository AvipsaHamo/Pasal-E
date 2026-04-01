using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PasalE.Api.DTOs;
using PasalE.Api.Services;
using System.Security.Claims;

namespace PasalE.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _auth.RegisterAsync(req);
        return Ok(result);
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _auth.LoginAsync(req);
        return Ok(result);
    }

    // POST api/auth/setup-shop
    [HttpPost("setup-shop")]
    [Authorize]
    public async Task<IActionResult> SetupShop([FromBody] SetupShopRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var ownerIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? User.FindFirstValue("sub");

        if (ownerIdClaim is null || !int.TryParse(ownerIdClaim, out var ownerId))
            return Unauthorized();

        var shop = await _auth.SetupShopAsync(ownerId, req);
        return Ok(shop);
    }

    // GET api/auth/me
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new
        {
            OwnerId      = User.FindFirstValue("sub"),
            Email        = User.FindFirstValue(ClaimTypes.Email),
            FirstName    = User.FindFirstValue("first_name"),
            AuthProvider = User.FindFirstValue("auth_provider")
        });
    }

    // GET api/auth/check-subdomain/{subdomain}
    [HttpGet("check-subdomain/{subdomain}")]
    public async Task<IActionResult> CheckSubdomain(string subdomain, [FromServices] IAuthService auth)
    {
        // Lightweight availability check re-uses shop repo via service
        // We cast to concrete — or add a dedicated method
        try
        {
            // Just try setup with a dummy ownerId won't work — add a dedicated repo call instead
            return Ok(new { available = true });  // placeholder; wire to ShopRepository directly if needed
        }
        catch
        {
            return Ok(new { available = false });
        }
    }
}
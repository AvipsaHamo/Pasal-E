using System.ComponentModel.DataAnnotations;

namespace PasalE.Api.DTOs;

// ── Request DTOs ────────────────────────────────────────────────────────────

public record RegisterRequest(
    [Required] string FirstName,
    [Required] string LastName,
    [Required][EmailAddress] string Email,
    [Required][MinLength(8)] string Password,
    [Required] string ConfirmPassword
);

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record SetupShopRequest(
    [Required] string BrandName,
    [Required] string Subdomain
);

// ── Response DTOs ───────────────────────────────────────────────────────────

public record AuthResponse(
    string Token,
    OwnerDto Owner,
    bool NeedsShopSetup
);

public record OwnerDto(
    int    OwnerId,
    string FirstName,
    string LastName,
    string Email,
    string AuthProvider
);

public record ShopDto(
    int    ShopId,
    string ShopName,
    string? BrandName,
    string? Subdomain
);

public record ApiError(string Message, string? Detail = null);
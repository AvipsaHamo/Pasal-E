using System.ComponentModel.DataAnnotations;

namespace PasalE.Api.DTOs;

public record AdminLoginRequest(
    [Required][EmailAddress] string Email,
    [Required] string Password
);

public record AdminAuthResponse(string Token, string Email);

public record ShopAdminViewDto(
    int     ShopId,
    int     OwnerId,
    string  OwnerName,
    string  OwnerEmail,
    string  ShopName,
    string? BrandName,
    string? Subdomain,
    string  SubdomainStatus,
    string? PhysicalLocation,
    string? Theme,
    string? Colour
);

public record UpdateSubdomainStatusRequest(
    [Required] string Status  // "approved" | "disapproved" | "pending"
);

using PasalE.Api.DTOs;
using PasalE.Api.Models;
using PasalE.Api.Repositories;

namespace PasalE.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<ShopDto>      SetupShopAsync(int ownerId, SetupShopRequest request);
}

public class AuthService : IAuthService
{
    private readonly IOwnerRepository _owners;
    private readonly IShopRepository  _shops;
    private readonly IJwtService      _jwt;

    public AuthService(
        IOwnerRepository owners,
        IShopRepository  shops,
        IJwtService      jwt)
    {
        _owners = owners;
        _shops  = shops;
        _jwt    = jwt;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req)
    {
        if (req.Password != req.ConfirmPassword)
            throw new InvalidOperationException("Passwords do not match.");

        var existing = await _owners.GetByEmailAsync(req.Email);
        if (existing is not null)
            throw new InvalidOperationException("Email is already registered.");

        var owner = new Owner
        {
            FirstName    = req.FirstName,
            LastName     = req.LastName,
            Email        = req.Email,
            Password     = BCrypt.Net.BCrypt.HashPassword(req.Password),
            AuthProvider = "local",
            CreatedAt    = DateTime.UtcNow
        };

        await _owners.CreateAsync(owner);
        var token = _jwt.GenerateToken(owner);

        return new AuthResponse(token, MapOwner(owner), NeedsShopSetup: true);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req)
    {
        var owner = await _owners.GetByEmailAsync(req.Email)
            ?? throw new UnauthorizedAccessException("Invalid email or password.");

        if (owner.AuthProvider == "google" || owner.Password is null)
            throw new UnauthorizedAccessException("This account uses Google sign-in. Please login with Google.");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, owner.Password))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var shop         = await _shops.GetByOwnerIdAsync(owner.OwnerId);
        var token        = _jwt.GenerateToken(owner);
        return new AuthResponse(token, MapOwner(owner), NeedsShopSetup: shop is null);
    }

    public async Task<ShopDto> SetupShopAsync(int ownerId, SetupShopRequest req)
    {
        var existing = await _shops.GetByOwnerIdAsync(ownerId);
        if (existing is not null)
            throw new InvalidOperationException("Shop already set up.");

        var subdomainTaken = await _shops.GetBySubdomainAsync(req.Subdomain.ToLower());
        if (subdomainTaken is not null)
            throw new InvalidOperationException("Subdomain is already taken.");

        var shop = new Shop
        {
            OwnerId   = ownerId,
            ShopName  = req.BrandName,
            BrandName = req.BrandName,
            Subdomain = req.Subdomain.ToLower()
        };

        await _shops.CreateAsync(shop);
        return new ShopDto(shop.ShopId, shop.ShopName, shop.BrandName, shop.Subdomain);
    }

    private static OwnerDto MapOwner(Owner o) =>
        new(o.OwnerId, o.FirstName, o.LastName, o.Email, o.AuthProvider);
}
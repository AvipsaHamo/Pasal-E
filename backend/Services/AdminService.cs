using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.DTOs;
using PasalE.Api.Models;
using PasalE.Api.Repositories;

namespace PasalE.Api.Services;

public interface IAdminService
{
    Task<AdminAuthResponse>      LoginAsync(AdminLoginRequest req);
    Task<List<ShopAdminViewDto>> GetAllShopsAsync();
    Task<ShopAdminViewDto>       UpdateSubdomainStatusAsync(int shopId, string status);
}

public class AdminService : IAdminService
{
    private readonly IAdminRepository _repo;
    private readonly IJwtService      _jwt;
    private readonly AppDbContext     _db;

    public AdminService(IAdminRepository repo, IJwtService jwt, AppDbContext db)
    {
        _repo = repo;
        _jwt  = jwt;
        _db   = db;
    }

    public async Task<AdminAuthResponse> LoginAsync(AdminLoginRequest req)
    {
        var admin = await _repo.GetByEmailAsync(req.Email)
            ?? throw new UnauthorizedAccessException("Invalid admin credentials.");

        if (!BCrypt.Net.BCrypt.Verify(req.Password, admin.Password))
            throw new UnauthorizedAccessException("Invalid admin credentials.");

        var token = _jwt.GenerateAdminToken(admin.Email);
        return new AdminAuthResponse(token, admin.Email);
    }

    public async Task<List<ShopAdminViewDto>> GetAllShopsAsync()
    {
        // Single joined query 
        var result = await _db.Shops
            .Join(_db.Owners,
                  s => s.OwnerId,
                  o => o.OwnerId,
                  (s, o) => new ShopAdminViewDto(
                      s.ShopId, o.OwnerId,
                      $"{o.FirstName} {o.LastName}",
                      o.Email, s.ShopName, s.BrandName,
                      s.Subdomain, s.SubdomainStatus,
                      s.PhysicalLocation, s.Theme, s.Colour))
            .ToListAsync();

        return result;
    }

    public async Task<ShopAdminViewDto> UpdateSubdomainStatusAsync(int shopId, string status)
    {
        var allowed = new[] { "pending", "approved", "disapproved" };
        if (!allowed.Contains(status))
            throw new InvalidOperationException($"Invalid status: {status}. Allowed: pending, approved, disapproved.");

        var shop = await _repo.GetShopByIdAsync(shopId)
            ?? throw new InvalidOperationException("Shop not found.");

        shop.SubdomainStatus = status;
        await _repo.SaveChangesAsync();

        // Single query 
        var dto = await _db.Shops
            .Where(s => s.ShopId == shopId)
            .Join(_db.Owners,
                  s => s.OwnerId,
                  o => o.OwnerId,
                  (s, o) => new ShopAdminViewDto(
                      s.ShopId, o.OwnerId,
                      $"{o.FirstName} {o.LastName}",
                      o.Email, s.ShopName, s.BrandName,
                      s.Subdomain, s.SubdomainStatus,
                      s.PhysicalLocation, s.Theme, s.Colour))
            .FirstAsync();

        return dto;
    }
}

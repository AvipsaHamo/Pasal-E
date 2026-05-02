using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.DTOs;
using PasalE.Api.Models;

namespace PasalE.Api.Repositories;

public interface IAdminRepository
{
    Task<Admin?> GetByEmailAsync(string email);
    Task<List<(Shop shop, Owner owner)>> GetAllShopsWithOwnersAsync();
    Task<Shop?> GetShopByIdAsync(int shopId);
    Task SaveChangesAsync();
}

public class AdminRepository : IAdminRepository
{
    private readonly AppDbContext _db;
    public AdminRepository(AppDbContext db) => _db = db;

    public Task<Admin?> GetByEmailAsync(string email) =>
        _db.Admins.FirstOrDefaultAsync(a => a.Email == email);

    public async Task<List<(Shop shop, Owner owner)>> GetAllShopsWithOwnersAsync()
    {
        var shops  = await _db.Shops.ToListAsync();
        var owners = await _db.Owners.ToListAsync();
        var ownerMap = owners.ToDictionary(o => o.OwnerId);

        return shops
            .Where(s => ownerMap.ContainsKey(s.OwnerId))
            .Select(s => (s, ownerMap[s.OwnerId]))
            .ToList();
    }

    public Task<Shop?> GetShopByIdAsync(int shopId) =>
        _db.Shops.FindAsync(shopId).AsTask();

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}

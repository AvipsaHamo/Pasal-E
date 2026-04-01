using Microsoft.EntityFrameworkCore;
using PasalE.Api.Data;
using PasalE.Api.Models;

namespace PasalE.Api.Repositories;

public interface IOwnerRepository
{
    Task<Owner?> GetByEmailAsync(string email);
    Task<Owner?> GetByGoogleIdAsync(string googleId);
    Task<Owner?> GetByIdAsync(int ownerId);
    Task<Owner>  CreateAsync(Owner owner);
    Task         SaveChangesAsync();
}

public class OwnerRepository : IOwnerRepository
{
    private readonly AppDbContext _db;
    public OwnerRepository(AppDbContext db) => _db = db;

    public Task<Owner?> GetByEmailAsync(string email) =>
        _db.Owners.FirstOrDefaultAsync(o => o.Email == email);

    public Task<Owner?> GetByGoogleIdAsync(string googleId) =>
        _db.Owners.FirstOrDefaultAsync(o => o.GoogleId == googleId);

    public Task<Owner?> GetByIdAsync(int ownerId) =>
        _db.Owners.FindAsync(ownerId).AsTask();

    public async Task<Owner> CreateAsync(Owner owner)
    {
        _db.Owners.Add(owner);
        await _db.SaveChangesAsync();
        return owner;
    }

    public Task SaveChangesAsync() => _db.SaveChangesAsync();
}

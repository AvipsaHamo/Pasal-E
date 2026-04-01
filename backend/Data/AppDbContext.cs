using Microsoft.EntityFrameworkCore;
using PasalE.Api.Models;

namespace PasalE.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Owner> Owners => Set<Owner>();
    public DbSet<Shop>  Shops  => Set<Shop>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Owner>(e =>
        {
            e.ToTable("owner");
            e.HasKey(o => o.OwnerId);
            e.Property(o => o.OwnerId).HasColumnName("owner_id");
            e.Property(o => o.FirstName).HasColumnName("first_name").IsRequired();
            e.Property(o => o.LastName).HasColumnName("last_name").IsRequired();
            e.Property(o => o.Email).HasColumnName("email").IsRequired();
            e.Property(o => o.Password).HasColumnName("password");
            e.Property(o => o.GoogleId).HasColumnName("google_id");
            e.Property(o => o.AuthProvider).HasColumnName("auth_provider").IsRequired();
            e.Property(o => o.CreatedAt).HasColumnName("created_at");
            e.HasIndex(o => o.Email).IsUnique();
            e.HasIndex(o => o.GoogleId).IsUnique();
        });

        modelBuilder.Entity<Shop>(e =>
        {
            e.ToTable("shop");
            e.HasKey(s => s.ShopId);
            e.Property(s => s.ShopId).HasColumnName("shop_id");
            e.Property(s => s.OwnerId).HasColumnName("owner_id");
            e.Property(s => s.ShopName).HasColumnName("shop_name").IsRequired();
            e.Property(s => s.BrandName).HasColumnName("brand_name");
            e.Property(s => s.Currency).HasColumnName("currency");
            e.Property(s => s.Subdomain).HasColumnName("subdomain");
            e.Property(s => s.Theme).HasColumnName("theme");
            e.Property(s => s.LogoImage).HasColumnName("logo_image");
            e.Property(s => s.BannerImage).HasColumnName("banner_image");
            e.Property(s => s.PhysicalLocation).HasColumnName("physical_location");
            e.Property(s => s.BankAccountDetails).HasColumnName("bank_account_details");
            e.HasIndex(s => s.Subdomain).IsUnique();
            e.HasOne<Owner>().WithOne().HasForeignKey<Shop>(s => s.OwnerId);
        });
    }
}

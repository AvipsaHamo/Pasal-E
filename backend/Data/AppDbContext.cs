using Microsoft.EntityFrameworkCore;
using PasalE.Api.Models;

namespace PasalE.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Owner>       Owners       => Set<Owner>();
    public DbSet<Shop>        Shops        => Set<Shop>();
    public DbSet<Category>    Categories   => Set<Category>();
    public DbSet<Product>     Products     => Set<Product>();
    public DbSet<Variation>   Variations   => Set<Variation>();
    public DbSet<Customer>    Customers    => Set<Customer>();
    public DbSet<Order>       Orders       => Set<Order>();
    public DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Owner>(e =>
        {
            e.ToTable("owner");
            e.HasKey(o => o.OwnerId);
            e.Property(o => o.OwnerId).HasColumnName("owner_id").UseIdentityByDefaultColumn();
            e.Property(o => o.FirstName).HasColumnName("first_name").IsRequired();
            e.Property(o => o.LastName).HasColumnName("last_name").IsRequired();
            e.Property(o => o.Email).HasColumnName("email").IsRequired();
            e.Property(o => o.Password).HasColumnName("password");
            e.Property(o => o.GoogleId).HasColumnName("google_id");
            e.Property(o => o.AuthProvider).HasColumnName("auth_provider").IsRequired();
            e.Property(o => o.CreatedAt).HasColumnName("created_at");
            e.HasIndex(o => o.Email).IsUnique();
            e.HasIndex(o => o.GoogleId).IsUnique().HasFilter("google_id IS NOT NULL");
        });

        mb.Entity<Shop>(e =>
        {
            e.ToTable("shop");
            e.HasKey(s => s.ShopId);
            e.Property(s => s.ShopId).HasColumnName("shop_id").UseIdentityByDefaultColumn();
            e.Property(s => s.OwnerId).HasColumnName("owner_id");
            e.Property(s => s.ShopName).HasColumnName("shop_name").IsRequired();
            e.Property(s => s.BrandName).HasColumnName("brand_name");
            e.Property(s => s.Currency).HasColumnName("currency");
            e.Property(s => s.Subdomain).HasColumnName("subdomain");
            e.Property(s => s.Theme).HasColumnName("theme");
            e.Property(s => s.Colour).HasColumnName("colour");
            e.Property(s => s.LogoImage).HasColumnName("logo_image");
            e.Property(s => s.BannerImage).HasColumnName("banner_image");
            e.Property(s => s.PhysicalLocation).HasColumnName("physical_location");
            e.Property(s => s.BankAccountDetails).HasColumnName("bank_account_details");
            e.HasIndex(s => s.Subdomain).IsUnique().HasFilter("subdomain IS NOT NULL");
            e.HasIndex(s => s.OwnerId).IsUnique();
            e.HasOne<Owner>().WithOne().HasForeignKey<Shop>(s => s.OwnerId);
        });

        mb.Entity<Category>(e =>
        {
            e.ToTable("category");
            e.HasKey(c => c.CategoryId);
            e.Property(c => c.CategoryId).HasColumnName("category_id").UseIdentityByDefaultColumn();
            e.Property(c => c.ShopId).HasColumnName("shop_id");
            e.Property(c => c.Name).HasColumnName("name").IsRequired();
            e.Property(c => c.Image).HasColumnName("image");
        });

        mb.Entity<Product>(e =>
        {
            e.ToTable("product");
            e.HasKey(p => p.ProductId);
            e.Property(p => p.ProductId).HasColumnName("product_id").UseIdentityByDefaultColumn();
            e.Property(p => p.ShopId).HasColumnName("shop_id");
            e.Property(p => p.CategoryId).HasColumnName("category_id");
            e.Property(p => p.Name).HasColumnName("name").IsRequired();
            e.Property(p => p.Description).HasColumnName("description");
            e.Property(p => p.Image).HasColumnName("image");
            e.Property(p => p.VendorName).HasColumnName("vendor_name");
            e.Property(p => p.Stock).HasColumnName("stock");
            e.Property(p => p.CostPrice).HasColumnName("cost_price").HasPrecision(10, 2);
            e.Property(p => p.SellingPrice).HasColumnName("selling_price").HasPrecision(10, 2);
            e.Property(p => p.OnlineAvailable).HasColumnName("online_available");
            e.Property(p => p.DateAdded).HasColumnName("date_added");
        });

        mb.Entity<Variation>(e =>
        {
            e.ToTable("variation");
            e.HasKey(v => v.VariationId);
            e.Property(v => v.VariationId).HasColumnName("variation_id").UseIdentityByDefaultColumn();
            e.Property(v => v.ProductId).HasColumnName("product_id");
            e.Property(v => v.Name).HasColumnName("name");
            e.Property(v => v.Image).HasColumnName("image");
            e.Property(v => v.SellingPrice).HasColumnName("selling_price").HasPrecision(10, 2);
        });

        mb.Entity<Customer>(e =>
        {
            e.ToTable("customer");
            e.HasKey(c => c.CustomerId);
            e.Property(c => c.CustomerId).HasColumnName("customer_id").UseIdentityByDefaultColumn();
            e.Property(c => c.FirstName).HasColumnName("first_name").IsRequired();
            e.Property(c => c.LastName).HasColumnName("last_name").IsRequired();
            e.Property(c => c.Phone).HasColumnName("phone");
            e.Property(c => c.Email).HasColumnName("email");
            e.Property(c => c.Address).HasColumnName("address");
            e.Property(c => c.Landmark).HasColumnName("landmark");
            e.Property(c => c.CreatedAt).HasColumnName("created_at");
            e.HasIndex(c => c.Email).IsUnique().HasFilter("email IS NOT NULL");
        });

        mb.Entity<Order>(e =>
        {
            e.ToTable("orders");
            e.HasKey(o => o.OrderId);
            e.Property(o => o.OrderId).HasColumnName("order_id").UseIdentityByDefaultColumn();
            e.Property(o => o.CustomerId).HasColumnName("customer_id");
            e.Property(o => o.ShopId).HasColumnName("shop_id");
            e.Property(o => o.OrderDate).HasColumnName("order_date");
            e.Property(o => o.TotalAmount).HasColumnName("total_amount").HasPrecision(10, 2);
            e.Property(o => o.PaymentScreenshot).HasColumnName("payment_screenshot");
            e.Property(o => o.PaymentType).HasColumnName("payment_type");
            e.Property(o => o.Status).HasColumnName("status").IsRequired()
                .HasDefaultValue("Pending");
        });

        mb.Entity<OrderDetail>(e =>
        {
            e.ToTable("order_details");
            e.HasKey(od => od.OrderDetailsId);
            e.Property(od => od.OrderDetailsId).HasColumnName("order_details_id").UseIdentityByDefaultColumn();
            e.Property(od => od.OrderId).HasColumnName("order_id");
            e.Property(od => od.ProductId).HasColumnName("product_id");
            e.Property(od => od.VariationId).HasColumnName("variation_id");
            e.Property(od => od.Quantity).HasColumnName("quantity");
            e.Property(od => od.Price).HasColumnName("price").HasPrecision(10, 2);
            e.Property(od => od.ProductName).HasColumnName("product_name");
            e.Property(od => od.VariationName).HasColumnName("variation_name");
        });
    }
}

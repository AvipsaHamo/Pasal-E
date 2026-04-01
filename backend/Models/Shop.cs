namespace PasalE.Api.Models;

public class Shop
{
    public int     ShopId             { get; set; }
    public int     OwnerId            { get; set; }
    public string  ShopName           { get; set; } = string.Empty;
    public string? BrandName          { get; set; }
    public string? Currency           { get; set; }
    public string? Subdomain          { get; set; }
    public string? Theme              { get; set; }
    public string? LogoImage          { get; set; }
    public string? BannerImage        { get; set; }
    public string? PhysicalLocation   { get; set; }
    public string? BankAccountDetails { get; set; }
}

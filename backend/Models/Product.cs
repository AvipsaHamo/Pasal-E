namespace PasalE.Api.Models;
public class Product
{
    public int      ProductId        { get; set; }
    public int      ShopId           { get; set; }
    public int?     CategoryId       { get; set; }
    public string   Name             { get; set; } = string.Empty;
    public string?  Description      { get; set; }
    public string?  Image            { get; set; }
    public string?  VendorName       { get; set; }
    public int      Stock            { get; set; } = 0;
    public decimal? CostPrice        { get; set; }
    public decimal? SellingPrice     { get; set; }
    public bool     OnlineAvailable  { get; set; } = true;
    public DateTime DateAdded        { get; set; } = DateTime.UtcNow;
}

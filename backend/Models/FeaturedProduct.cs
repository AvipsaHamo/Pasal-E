namespace PasalE.Api.Models;

public class FeaturedProduct
{
    public int      FeaturedId { get; set; }
    public int      ShopId     { get; set; }
    public int      ProductId  { get; set; }
    public int      SortOrder  { get; set; } = 0;
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
}

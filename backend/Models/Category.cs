namespace PasalE.Api.Models;
public class Category
{
    public int     CategoryId { get; set; }
    public int     ShopId     { get; set; }
    public string  Name       { get; set; } = string.Empty;
    public string? Image      { get; set; }
}

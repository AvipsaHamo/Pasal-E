namespace PasalE.Api.Models;
public class Variation
{
    public int      VariationId  { get; set; }
    public int      ProductId    { get; set; }
    public string?  Name         { get; set; }
    public string?  Image        { get; set; }
    public decimal? SellingPrice { get; set; }
}

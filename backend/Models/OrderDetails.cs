namespace PasalE.Api.Models;

public class OrderDetail
{
    public int      OrderDetailsId { get; set; }
    public int      OrderId        { get; set; }
    public int?     ProductId      { get; set; }
    public int?     VariationId    { get; set; }
    public int      Quantity       { get; set; }
    public decimal? Price          { get; set; }
    public string?  ProductName    { get; set; }
    public string?  VariationName  { get; set; }
}

namespace PasalE.Api.Models;

public class Order
{
    public int      OrderId            { get; set; }
    public int?     CustomerId         { get; set; }
    public int      ShopId             { get; set; }
    public DateTime OrderDate          { get; set; } = DateTime.UtcNow;
    public decimal? TotalAmount        { get; set; }
    public string?  PaymentScreenshot  { get; set; }
    public string?  PaymentType        { get; set; }
    public string   Status             { get; set; } = "Pending";
}

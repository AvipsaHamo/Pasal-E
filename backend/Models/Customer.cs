namespace PasalE.Api.Models;

public class Customer
{
    public int      CustomerId { get; set; }
    public string   FirstName  { get; set; } = string.Empty;
    public string   LastName   { get; set; } = string.Empty;
    public string?  Phone      { get; set; }
    public string?  Email      { get; set; }
    public string?  Address    { get; set; }
    public string?  Landmark   { get; set; }
    public DateTime CreatedAt  { get; set; } = DateTime.UtcNow;
}

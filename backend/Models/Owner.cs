namespace PasalE.Api.Models;

public class Owner
{
    public int      OwnerId      { get; set; }
    public string   FirstName    { get; set; } = string.Empty;
    public string   LastName     { get; set; } = string.Empty;
    public string   Email        { get; set; } = string.Empty;
    public string?  Password     { get; set; }
    public string?  GoogleId     { get; set; }
    public string   AuthProvider { get; set; } = "local";  // "local" | "google"
    public DateTime CreatedAt    { get; set; } = DateTime.UtcNow;
}

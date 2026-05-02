namespace PasalE.Api.Models;

public class Admin
{
    public int      AdminId   { get; set; }
    public string   Email     { get; set; } = string.Empty;
    public string   Password  { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

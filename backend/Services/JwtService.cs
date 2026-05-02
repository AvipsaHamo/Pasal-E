using Microsoft.IdentityModel.Tokens;
using PasalE.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace PasalE.Api.Services;

public interface IJwtService
{
    string GenerateToken(Owner owner);
    string GenerateAdminToken(string email);
    int?   ValidateAndGetOwnerId(string token);
}

public class JwtService : IJwtService
{
    private readonly string _secret;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int    _expiryHours;

    public JwtService()
    {
        _secret      = Environment.GetEnvironmentVariable("JWT_SECRET")!;
        _issuer      = Environment.GetEnvironmentVariable("JWT_ISSUER")   ?? "pasal-e";
        _audience    = Environment.GetEnvironmentVariable("JWT_AUDIENCE")  ?? "pasal-e-users";
        _expiryHours = int.TryParse(Environment.GetEnvironmentVariable("JWT_EXPIRY_HOURS"), out var h) ? h : 24;
    }

    public string GenerateToken(Owner owner)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   owner.OwnerId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, owner.Email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim("first_name",    owner.FirstName),
            new Claim("auth_provider", owner.AuthProvider),
            new Claim("role",          "owner")
        };
        return BuildToken(claims);
    }

    public string GenerateAdminToken(string email)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new Claim("role", "admin")
        };
        return BuildToken(claims);
    }

    public int? ValidateAndGetOwnerId(string token)
    {
        try
        {
            var handler = new JwtSecurityTokenHandler();
            var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = key,
                ValidateIssuer           = true,
                ValidIssuer              = _issuer,
                ValidateAudience         = true,
                ValidAudience            = _audience,
                ValidateLifetime         = true,
                ClockSkew                = TimeSpan.Zero
            }, out var validatedToken);
            var jwt = (JwtSecurityToken)validatedToken;
            return int.TryParse(jwt.Subject, out var id) ? id : null;
        }
        catch { return null; }
    }

    private string BuildToken(Claim[] claims)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _audience,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(_expiryHours),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

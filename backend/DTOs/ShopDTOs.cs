using System.ComponentModel.DataAnnotations;

namespace PasalE.Api.DTOs;

public record ShopInfoDto(
    int     ShopId,
    string  ShopName,
    string? BrandName,
    string? PhysicalLocation,
    string? Subdomain,
    string  SubdomainStatus,
    string? Theme,
    string? Colour,
    string? LogoImage,
    string? BannerImage
);

public record UpdateShopRequest(
    string?  BrandName,
    string?  PhysicalLocation,
    string?  Theme,
    string?  Colour,
    string?  LogoImage,
    string?  BannerImage
);

// ── Category Management ───────────────────────────────────────────────────

public record CreateCategoryRequest(
    [Required] string Name,
    string? Image
);

public record CategoryDetailDto(
    int     CategoryId,
    string  Name,
    string? Image
);

public record DeleteCategoryResponse(string Message);

// ── Product Details (View/Edit) ───────────────────────────────────────────

public record ProductDetailDto(
    int      ProductId,
    string   Name,
    int?     CategoryId,
    string?  CategoryName,
    string?  Description,
    string?  Image,
    string?  VendorName,
    int      Stock,
    decimal? CostPrice,
    decimal? SellingPrice,
    bool     OnlineAvailable,
    List<VariationDetailDto> Variations
);

public record VariationDetailDto(
    int      VariationId,
    string?  Name,
    string?  Image,
    decimal? SellingPrice
);

public record UpdateProductRequest(
    [Required] string Name,
    int?     CategoryId,
    string?  Description,
    string?  Image,
    string?  VendorName,
    int      Stock,
    decimal? CostPrice,
    decimal? SellingPrice,
    bool     OnlineAvailable,
    List<UpsertVariationRequest>? Variations
);

public record UpsertVariationRequest(
    int?     VariationId,
    string   Name,
    string?  Image,
    decimal? SellingPrice
);

public record ImageUploadResponse(string Url);

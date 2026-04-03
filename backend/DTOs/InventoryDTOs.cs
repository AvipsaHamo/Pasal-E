// src/backend/DTOs/InventoryDTOs.cs
using System.ComponentModel.DataAnnotations;

namespace PasalE.Api.DTOs;

// ── Category ──────────────────────────────────────────────────────────────
public record CategoryDto(int CategoryId, string Name);

// ── Product ───────────────────────────────────────────────────────────────
public record ProductListItemDto(
    int     ProductId,
    string  Name,
    string? VendorName,
    int     Stock,
    string? CategoryName
);

public record CreateProductRequest(
    [Required] string  Name,
    int?               CategoryId,
    string?            Description,
    string?            VendorName,
    int                Stock,
    decimal?           CostPrice,
    decimal?           SellingPrice,
    bool               OnlineAvailable,
    List<CreateVariationRequest>? Variations
);

public record ProductDto(
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
    List<VariationDto> Variations
);

// ── Variation ─────────────────────────────────────────────────────────────
public record CreateVariationRequest(
    [Required] string Name,
    decimal?          SellingPrice
);

public record VariationDto(
    int     VariationId,
    string? Name,
    decimal? SellingPrice
);

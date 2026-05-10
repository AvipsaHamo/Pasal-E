using System.ComponentModel.DataAnnotations;

namespace PasalE.Api.DTOs;

public record FeaturedProductDto(
    int      FeaturedId,
    int      ProductId,
    string   ProductName,
    string?  ProductImage,
    decimal? SellingPrice,
    int      SortOrder
);

public record AddFeaturedProductRequest(
    [Required] int ProductId,
    int SortOrder = 0
);

public record ReorderFeaturedRequest(
    [Required] List<FeaturedOrderItem> Items
);

public record FeaturedOrderItem(int FeaturedId, int SortOrder);

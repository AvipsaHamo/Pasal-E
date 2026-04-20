namespace PasalE.Api.DTOs;

public record OrderListItemDto(
    int      OrderId,
    string   CustomerName,
    string?  Phone,
    string   OrderDate,
    string   Status
);

public record OrderDetailLineDto(
    int?     ProductId,
    string?  ProductName,
    string?  VariationName,
    int      Quantity,
    decimal? Price
);

public record OrderFullDto(
    int      OrderId,
    string   CustomerName,
    string?  Phone,
    string?  Email,
    string?  Address,
    string?  Landmark,
    string   OrderDate,
    string   Status,
    decimal? TotalAmount,
    List<OrderDetailLineDto> Details
);

public record UpdateOrderStatusRequest(string Status);

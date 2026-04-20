namespace PasalE.Api.DTOs;

public record DashboardSummaryDto(
    decimal Revenue,
    decimal RevenueDelta,
    int     TotalCustomers,
    int     CustomersDelta,
    int     TotalOrders,
    int     OrdersDelta,
    string  Period
);

public record ChartPointDto(string Label, decimal Income, decimal Expense);

public record ChartDataDto(
    int                  Year,
    int                  Month,
    List<ChartPointDto>  Points
);

public record AvailableYearsDto(List<int> Years);

using PasalE.Api.DTOs;
using System.Net;
using System.Text.Json;

namespace PasalE.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly bool _isDev;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IWebHostEnvironment env)
    {
        _next   = next;
        _logger = logger;
        _isDev  = env.IsDevelopment();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteError(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await WriteError(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Type}: {Message}", ex.GetType().Name, ex.Message);

            // In Development, surface the real error so it is visible in Swagger and curl
            var message = _isDev
                ? $"{ex.GetType().Name}: {ex.Message}"
                : "An unexpected error occurred.";
            var detail = _isDev ? ex.StackTrace : null;

            await WriteError(context, HttpStatusCode.InternalServerError, message, detail);
        }
    }

    private static async Task WriteError(HttpContext ctx, HttpStatusCode status, string message, string? detail = null)
    {
        ctx.Response.StatusCode  = (int)status;
        ctx.Response.ContentType = "application/json";
        var body = JsonSerializer.Serialize(new ApiError(message, detail));
        await ctx.Response.WriteAsync(body);
    }
}
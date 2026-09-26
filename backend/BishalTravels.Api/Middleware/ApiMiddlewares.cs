using System.Diagnostics;
using System.Net;
using System.Text.Json;

namespace BishalTravels.Api.Middleware;

// 1. Global Exception Handling Middleware
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;

        var statusCode = exception switch
        {
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            _ => (int)HttpStatusCode.InternalServerError
        };

        _logger.LogError(exception, "[ERROR] {Method} {Path} failed with status {StatusCode}. TraceId: {TraceId}",
            context.Request.Method,
            context.Request.Path,
            statusCode,
            traceId);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new
        {
            success = false,
            statusCode = statusCode,
            message = exception.Message,
            traceId = traceId,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}

// 2. Request Logging & Performance Middleware
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var request = context.Request;

        // Skip noisy swagger and health check logs
        var isHealthOrDoc = request.Path.StartsWithSegments("/health") || 
                            request.Path.StartsWithSegments("/swagger");

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;

            context.Response.Headers["X-Response-Time-Ms"] = elapsedMs.ToString();

            if (!isHealthOrDoc)
            {
                var statusCode = context.Response.StatusCode;
                var logLevel = statusCode >= 500 ? LogLevel.Error :
                               statusCode >= 400 ? LogLevel.Warning : 
                               LogLevel.Information;

                _logger.Log(logLevel, "HTTP {Method} {Path}{Query} responded {StatusCode} in {ElapsedMs} ms",
                    request.Method,
                    request.Path,
                    request.QueryString,
                    statusCode,
                    elapsedMs);
            }
        }
    }
}

// 3. Extension Methods for Program.cs Pipeline
public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseCustomMiddlewares(this IApplicationBuilder app)
    {
        app.UseMiddleware<GlobalExceptionMiddleware>();
        app.UseMiddleware<RequestLoggingMiddleware>();
        return app;
    }
}

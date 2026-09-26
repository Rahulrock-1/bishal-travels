using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProxyController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ProxyController> _logger;

    // Domain whitelist to protect against Server-Side Request Forgery (SSRF)
    private static readonly HashSet<string> AllowedHosts = new(StringComparer.OrdinalIgnoreCase)
    {
        "api.postalpincode.in",
        "nominatim.openstreetmap.org",
        "api.open-meteo.com",
        "raw.githubusercontent.com",
        "api.github.com"
    };

    public ProxyController(IHttpClientFactory httpClientFactory, ILogger<ProxyController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    [HttpGet("forward")]
    public async Task<IActionResult> ForwardGet([FromQuery] string targetUrl)
    {
        if (string.IsNullOrWhiteSpace(targetUrl))
        {
            return BadRequest(new { message = "Target URL parameter 'targetUrl' is required." });
        }

        if (!Uri.TryCreate(targetUrl, UriKind.Absolute, out var uri) || 
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            return BadRequest(new { message = "Invalid or unsupported target URL scheme. Only HTTP/HTTPS allowed." });
        }

        if (!AllowedHosts.Contains(uri.Host))
        {
            _logger.LogWarning("Security Guard: Blocked attempt to proxy unauthorized host: {Host}", uri.Host);
            return StatusCode(403, new 
            { 
                message = $"Target host '{uri.Host}' is not in the server-side proxy whitelist.",
                allowedHosts = AllowedHosts
            });
        }

        try
        {
            var client = _httpClientFactory.CreateClient("ServerSideProxyClient");
            client.Timeout = TimeSpan.FromSeconds(15);
            var response = await client.GetAsync(uri);
            var content = await response.Content.ReadAsStringAsync();
            var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/json";

            return Content(content, contentType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Server-Side Proxy failed to relay request to {Url}", targetUrl);
            return StatusCode(502, new { message = "Failed to relay request to upstream service.", error = ex.Message });
        }
    }

    [HttpGet("status")]
    public IActionResult GetProxyStatus()
    {
        return Ok(new
        {
            proxy = "ServerSideGatewayProxy",
            status = "Active",
            forwardedFor = Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? HttpContext.Connection.RemoteIpAddress?.ToString(),
            forwardedProto = Request.Headers["X-Forwarded-Proto"].FirstOrDefault() ?? Request.Scheme,
            forwardedHost = Request.Headers["X-Forwarded-Host"].FirstOrDefault() ?? Request.Host.Value,
            whitelistedHosts = AllowedHosts
        });
    }
}

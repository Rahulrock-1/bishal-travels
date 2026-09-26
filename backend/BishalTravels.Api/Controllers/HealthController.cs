using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Data;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;
    private static readonly DateTime StartTime = DateTime.UtcNow;

    public HealthController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        bool dbHealthy;
        string dbMessage;

        try
        {
            dbHealthy = await _context.Database.CanConnectAsync();
            dbMessage = dbHealthy ? "Connected" : "Unable to connect to database";
        }
        catch (Exception ex)
        {
            dbHealthy = false;
            dbMessage = ex.Message;
        }

        var payload = new
        {
            status = dbHealthy ? "Healthy" : "Degraded",
            service = "Bishal Travels .NET Web API",
            database = dbMessage,
            uptime = DateTime.UtcNow - StartTime,
            timestamp = DateTime.UtcNow
        };

        if (dbHealthy)
        {
            return Ok(payload);
        }

        // Return 200 during startup/fallback or 503 if strictly required
        return Ok(payload);
    }
}

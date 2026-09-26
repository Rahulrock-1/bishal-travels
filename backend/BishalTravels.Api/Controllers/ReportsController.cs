using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Common;
using BishalTravels.Api.Features;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("monthly")]
    public async Task<ActionResult> GetMonthlyReport([FromQuery] string? month)
    {
        var report = await _mediator.Send(new GetMonthlyReportQuery(month));
        return Ok(report);
    }
}

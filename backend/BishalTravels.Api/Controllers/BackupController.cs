using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Features;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BackupController : ControllerBase
{
    private readonly IMediator _mediator;

    public BackupController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("export")]
    public async Task<ActionResult<AppStateDataDto>> ExportBackup()
    {
        var backup = await _mediator.Send(new ExportBackupQuery());
        return Ok(backup);
    }

    [HttpPost("restore")]
    public async Task<ActionResult> RestoreBackup([FromBody] AppStateDataDto dto)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Invalid backup payload." });
        }

        await _mediator.Send(new RestoreBackupCommand(dto));
        return Ok(new { message = "Database successfully restored from backup." });
    }

    [HttpPost("reset")]
    public async Task<ActionResult> ResetToSampleData()
    {
        await _mediator.Send(new ResetToSampleDataCommand());
        return Ok(new { message = "Database successfully reset to official template state." });
    }
}

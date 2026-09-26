using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Features;
using BishalTravels.Api.Models;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DutySlipsController : ControllerBase
{
    private readonly IMediator _mediator;

    public DutySlipsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DutySlip>>> GetDutySlips(
        [FromQuery] string? status, 
        [FromQuery] string? clientId, 
        [FromQuery] string? vehicleId)
    {
        var slips = await _mediator.Send(new GetDutySlipsQuery(status, clientId, vehicleId));
        return Ok(slips);
    }

    [HttpGet("unbilled")]
    public async Task<ActionResult<IEnumerable<DutySlip>>> GetUnbilledDutySlips(
        [FromQuery] string? clientId, 
        [FromQuery] string? vehicleId)
    {
        var slips = await _mediator.Send(new GetUnbilledDutySlipsQuery(clientId, vehicleId));
        return Ok(slips);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DutySlip>> GetDutySlip(string id)
    {
        var dutySlip = await _mediator.Send(new GetDutySlipByIdQuery(id));
        if (dutySlip == null)
        {
            return NotFound(new { message = $"Duty Slip with ID {id} not found." });
        }
        return Ok(dutySlip);
    }

    [HttpPost]
    public async Task<ActionResult<DutySlip>> CreateDutySlip([FromBody] CreateDutySlipDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DutySlipNo) || string.IsNullOrWhiteSpace(dto.Date))
        {
            return BadRequest(new { message = "Duty Slip No and Date are required." });
        }

        var created = await _mediator.Send(new CreateDutySlipCommand(dto));
        return CreatedAtAction(nameof(GetDutySlip), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DutySlip>> UpdateDutySlip(string id, [FromBody] UpdateDutySlipDto dto)
    {
        var updated = await _mediator.Send(new UpdateDutySlipCommand(id, dto));
        if (updated == null)
        {
            return NotFound(new { message = $"Duty Slip with ID {id} not found." });
        }
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDutySlip(string id)
    {
        var deleted = await _mediator.Send(new DeleteDutySlipCommand(id));
        if (!deleted)
        {
            return NotFound(new { message = $"Duty Slip with ID {id} not found." });
        }
        return NoContent();
    }
}

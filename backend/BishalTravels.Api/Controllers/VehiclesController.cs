using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Features;
using BishalTravels.Api.Models;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiclesController : ControllerBase
{
    private readonly IMediator _mediator;

    public VehiclesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles()
    {
        var fleet = await _mediator.Send(new GetFleetQuery());
        return Ok(fleet);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vehicle>> GetVehicle(string id)
    {
        var vehicle = await _mediator.Send(new GetVehicleByIdQuery(id));
        if (vehicle == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found." });
        }
        return Ok(vehicle);
    }

    [HttpPost]
    public async Task<ActionResult<Vehicle>> CreateVehicle([FromBody] CreateVehicleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RegNumber))
        {
            return BadRequest(new { message = "Vehicle Registration Number is required." });
        }

        var vehicle = await _mediator.Send(new CreateVehicleCommand(dto));
        return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Vehicle>> UpdateVehicle(string id, [FromBody] UpdateVehicleDto dto)
    {
        var updated = await _mediator.Send(new UpdateVehicleCommand(id, dto));
        if (updated == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found." });
        }
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteVehicle(string id)
    {
        var deleted = await _mediator.Send(new DeleteVehicleCommand(id));
        if (!deleted)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found." });
        }
        return NoContent();
    }
}

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
public class ClientsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ClientsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Client>>> GetClients()
    {
        var clients = await _mediator.Send(new GetClientsQuery());
        return Ok(clients);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<ActionResult<Client>> GetClient(string id)
    {
        var client = await _mediator.Send(new GetClientByIdQuery(id));
        if (client == null)
        {
            return NotFound(new { message = $"Client with ID {id} not found." });
        }
        return Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<Client>> CreateClient([FromBody] CreateClientDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName) || string.IsNullOrWhiteSpace(dto.Phone))
        {
            return BadRequest(new { message = "Company Name and Phone are required." });
        }

        var client = await _mediator.Send(new CreateClientCommand(dto));
        return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Client>> UpdateClient(string id, [FromBody] UpdateClientDto dto)
    {
        var updated = await _mediator.Send(new UpdateClientCommand(id, dto));
        if (updated == null)
        {
            return NotFound(new { message = $"Client with ID {id} not found." });
        }
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(string id)
    {
        var deleted = await _mediator.Send(new DeleteClientCommand(id));
        if (!deleted)
        {
            return NotFound(new { message = $"Client with ID {id} not found." });
        }
        return NoContent();
    }
}

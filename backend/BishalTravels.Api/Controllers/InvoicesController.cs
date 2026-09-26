using Microsoft.AspNetCore.Mvc;
using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Features;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IMediator _mediator;

    public InvoicesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceResponseDto>>> GetInvoices(
        [FromQuery] string? status, 
        [FromQuery] string? month, 
        [FromQuery] string? clientId)
    {
        var invoices = await _mediator.Send(new GetInvoicesQuery(status, month, clientId));
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceResponseDto>> GetInvoice(string id)
    {
        var invoice = await _mediator.Send(new GetInvoiceByIdQuery(id));
        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }
        return Ok(invoice);
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceResponseDto>> CreateInvoice([FromBody] CreateInvoiceRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ClientId))
        {
            return BadRequest(new { message = "Client is required to generate an invoice." });
        }

        var invoice = await _mediator.Send(new CreateInvoiceCommand(dto));
        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceResponseDto>> UpdateInvoice(string id, [FromBody] UpdateInvoiceRequestDto dto)
    {
        var updated = await _mediator.Send(new UpdateInvoiceCommand(id, dto));
        if (updated == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }
        return Ok(updated);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateInvoiceStatus(string id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        var success = await _mediator.Send(new UpdateInvoiceStatusCommand(id, dto.Status));
        if (!success)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInvoice(string id)
    {
        var deleted = await _mediator.Send(new DeleteInvoiceCommand(id));
        if (!deleted)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }
        return NoContent();
    }
}

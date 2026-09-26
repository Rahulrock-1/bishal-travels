using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;
using BishalTravels.Api.DTOs;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;

    public ClientsController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Client>>> GetClients()
    {
        var clients = await _context.Clients
            .OrderBy(c => c.CompanyName)
            .ToListAsync();
        return Ok(clients);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Client>> GetClient(string id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound(new { message = $"Client with ID {id} not found." });
        }
        return Ok(client);
    }

    [HttpPost]
    public async Task<ActionResult<Client>> CreateClient([FromBody] CreateClientDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CompanyName))
        {
            return BadRequest(new { message = "Company Name is required." });
        }

        var client = new Client
        {
            Id = $"client-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}",
            Name = dto.Name.Trim(),
            CompanyName = dto.CompanyName.Trim(),
            Gstin = (dto.Gstin ?? "").Trim().ToUpper(),
            Pan = dto.Pan?.Trim().ToUpper(),
            Address = dto.Address.Trim(),
            Phone = dto.Phone.Trim(),
            Email = dto.Email.Trim(),
            ContractRefNo = dto.ContractRefNo.Trim(),
            ContractStartDate = dto.ContractStartDate,
            ContractEndDate = dto.ContractEndDate,
            PaymentTermsDays = dto.PaymentTermsDays <= 0 ? 30 : dto.PaymentTermsDays,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClient), new { id = client.Id }, client);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Client>> UpdateClient(string id, [FromBody] UpdateClientDto dto)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound(new { message = $"Client with ID {id} not found." });
        }

        if (dto.Name != null) client.Name = dto.Name;
        if (dto.CompanyName != null) client.CompanyName = dto.CompanyName;
        if (dto.Gstin != null) client.Gstin = dto.Gstin.ToUpper();
        if (dto.Pan != null) client.Pan = dto.Pan.ToUpper();
        if (dto.Address != null) client.Address = dto.Address;
        if (dto.Phone != null) client.Phone = dto.Phone;
        if (dto.Email != null) client.Email = dto.Email;
        if (dto.ContractRefNo != null) client.ContractRefNo = dto.ContractRefNo;
        if (dto.ContractStartDate != null) client.ContractStartDate = dto.ContractStartDate;
        if (dto.ContractEndDate != null) client.ContractEndDate = dto.ContractEndDate;
        if (dto.PaymentTermsDays.HasValue) client.PaymentTermsDays = dto.PaymentTermsDays.Value;
        if (dto.Notes != null) client.Notes = dto.Notes;

        client.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(client);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteClient(string id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null)
        {
            return NotFound(new { message = $"Client with ID {id} not found." });
        }

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

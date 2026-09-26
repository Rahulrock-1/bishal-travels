using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;
using BishalTravels.Api.DTOs;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };

    public InvoicesController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceResponseDto>>> GetInvoices([FromQuery] string? status, [FromQuery] string? month, [FromQuery] string? clientId)
    {
        var query = _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.Client)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(i => i.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(month))
        {
            query = query.Where(i => i.BillingMonth == month);
        }
        if (!string.IsNullOrWhiteSpace(clientId))
        {
            query = query.Where(i => i.ClientId == clientId);
        }

        var invoices = await query
            .OrderByDescending(i => i.InvoiceDate)
            .ThenByDescending(i => i.InvoiceNumber)
            .ToListAsync();

        var result = invoices.Select(MapToResponseDto).ToList();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceResponseDto>> GetInvoice(string id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.Client)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        return Ok(MapToResponseDto(invoice));
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceResponseDto>> CreateInvoice([FromBody] CreateInvoiceDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.InvoiceNumber))
        {
            return BadRequest(new { message = "Invoice Number is required." });
        }

        var cleanInvNumber = dto.InvoiceNumber.Trim().ToUpper();
        if (await _context.Invoices.AnyAsync(i => i.InvoiceNumber == cleanInvNumber))
        {
            return Conflict(new { message = $"Invoice with number '{cleanInvNumber}' already exists." });
        }

        var invoiceId = $"inv-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}";

        var invoice = new Invoice
        {
            Id = invoiceId,
            InvoiceNumber = cleanInvNumber,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            BillingMonth = dto.BillingMonth,
            ClientId = dto.ClientId,
            ClientSnapshotJson = JsonSerializer.Serialize(dto.ClientSnapshot, JsonOptions),
            ContractRefNo = dto.ContractRefNo,
            AttachedDutySlipIdsJson = JsonSerializer.Serialize(dto.AttachedDutySlipIds ?? new List<string>(), JsonOptions),
            Subtotal = dto.Subtotal,
            TaxType = dto.TaxType,
            TaxRate = dto.TaxRate,
            Cgst = dto.Cgst,
            Sgst = dto.Sgst,
            Igst = dto.Igst,
            IsInterstate = dto.IsInterstate,
            Discount = dto.Discount,
            AdvanceReceived = dto.AdvanceReceived,
            TdsRate = dto.TdsRate,
            TdsAmount = dto.TdsAmount,
            GrandTotal = dto.GrandTotal,
            NetPayable = dto.NetPayable,
            AmountInWords = dto.AmountInWords,
            BankDetailsJson = JsonSerializer.Serialize(dto.BankDetails, JsonOptions),
            TradeLicenseNo = dto.TradeLicenseNo,
            CompanyGstin = dto.CompanyGstin,
            CompanyPan = dto.CompanyPan,
            CompanyPhone = dto.CompanyPhone,
            CompanyEmail = dto.CompanyEmail,
            CompanyAddress = dto.CompanyAddress,
            Status = dto.Status,
            Notes = dto.Notes,
            TermsJson = JsonSerializer.Serialize(dto.Terms ?? new List<string>(), JsonOptions),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Add items
        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var itemDto in dto.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Id = string.IsNullOrWhiteSpace(itemDto.Id) 
                        ? $"item-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}" 
                        : itemDto.Id,
                    InvoiceId = invoiceId,
                    Description = itemDto.Description,
                    VehicleRegNo = itemDto.VehicleRegNo,
                    VehicleModel = itemDto.VehicleModel,
                    BillingType = itemDto.BillingType,
                    BasePackageAmount = itemDto.BasePackageAmount,
                    TotalRunKm = itemDto.TotalRunKm,
                    RatePerKm = itemDto.RatePerKm,
                    KmCharges = itemDto.KmCharges,
                    ExtraKm = itemDto.ExtraKm,
                    ExtraKmRate = itemDto.ExtraKmRate,
                    ExtraKmCharges = itemDto.ExtraKmCharges,
                    ExtraHours = itemDto.ExtraHours,
                    ExtraHourRate = itemDto.ExtraHourRate,
                    ExtraHourCharges = itemDto.ExtraHourCharges,
                    NightCharges = itemDto.NightCharges,
                    ParkingCharges = itemDto.ParkingCharges,
                    TollCharges = itemDto.TollCharges,
                    DriverAllowance = itemDto.DriverAllowance,
                    OtherCharges = itemDto.OtherCharges,
                    Amount = itemDto.Amount
                });
            }
        }

        // Mark attached duty slips as Billed
        if (dto.AttachedDutySlipIds != null && dto.AttachedDutySlipIds.Any())
        {
            var slips = await _context.DutySlips
                .Where(s => dto.AttachedDutySlipIds.Contains(s.Id))
                .ToListAsync();

            foreach (var slip in slips)
            {
                slip.Status = "Billed";
                slip.InvoiceId = invoiceId;
                slip.UpdatedAt = DateTime.UtcNow;
            }
        }

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        // Reload invoice with client and items
        var savedInvoice = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.Client)
            .FirstAsync(i => i.Id == invoiceId);

        return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, MapToResponseDto(savedInvoice));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceResponseDto>> UpdateInvoice(string id, [FromBody] CreateInvoiceDto dto)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        invoice.InvoiceDate = dto.InvoiceDate;
        invoice.DueDate = dto.DueDate;
        invoice.BillingMonth = dto.BillingMonth;
        invoice.ClientId = dto.ClientId;
        invoice.ClientSnapshotJson = JsonSerializer.Serialize(dto.ClientSnapshot, JsonOptions);
        invoice.ContractRefNo = dto.ContractRefNo;
        invoice.Subtotal = dto.Subtotal;
        invoice.TaxType = dto.TaxType;
        invoice.TaxRate = dto.TaxRate;
        invoice.Cgst = dto.Cgst;
        invoice.Sgst = dto.Sgst;
        invoice.Igst = dto.Igst;
        invoice.IsInterstate = dto.IsInterstate;
        invoice.Discount = dto.Discount;
        invoice.AdvanceReceived = dto.AdvanceReceived;
        invoice.TdsRate = dto.TdsRate;
        invoice.TdsAmount = dto.TdsAmount;
        invoice.GrandTotal = dto.GrandTotal;
        invoice.NetPayable = dto.NetPayable;
        invoice.AmountInWords = dto.AmountInWords;
        invoice.BankDetailsJson = JsonSerializer.Serialize(dto.BankDetails, JsonOptions);
        invoice.Status = dto.Status;
        invoice.Notes = dto.Notes;
        invoice.TermsJson = JsonSerializer.Serialize(dto.Terms, JsonOptions);
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(MapToResponseDto(invoice));
    }

    [HttpPatch("{id}/status")]
    public async Task<ActionResult> UpdateInvoiceStatus(string id, [FromBody] UpdateInvoiceStatusDto dto)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        invoice.Status = dto.Status;
        invoice.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Invoice status updated to {dto.Status}." });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteInvoice(string id)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null)
        {
            return NotFound(new { message = $"Invoice with ID {id} not found." });
        }

        // Unlink any billed duty slips
        var attachedSlips = await _context.DutySlips
            .Where(s => s.InvoiceId == id)
            .ToListAsync();

        foreach (var slip in attachedSlips)
        {
            slip.Status = "Pending";
            slip.InvoiceId = null;
            slip.UpdatedAt = DateTime.UtcNow;
        }

        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static InvoiceResponseDto MapToResponseDto(Invoice i)
    {
        var clientSnapshot = JsonSerializer.Deserialize<Client>(i.ClientSnapshotJson) 
            ?? i.Client 
            ?? new Client { Id = i.ClientId, CompanyName = "Unknown Client" };

        var attachedIds = JsonSerializer.Deserialize<List<string>>(i.AttachedDutySlipIdsJson) ?? new List<string>();
        var bankDetails = JsonSerializer.Deserialize<BankDetailsDto>(i.BankDetailsJson) 
            ?? new BankDetailsDto("", "", "", "", "", "");
        var terms = JsonSerializer.Deserialize<List<string>>(i.TermsJson) ?? new List<string>();

        var items = i.Items.Select(item => new InvoiceItemDto(
            item.Id,
            item.Description,
            item.VehicleRegNo,
            item.VehicleModel,
            item.BillingType,
            item.BasePackageAmount,
            item.TotalRunKm,
            item.RatePerKm,
            item.KmCharges,
            item.ExtraKm,
            item.ExtraKmRate,
            item.ExtraKmCharges,
            item.ExtraHours,
            item.ExtraHourRate,
            item.ExtraHourCharges,
            item.NightCharges,
            item.ParkingCharges,
            item.TollCharges,
            item.DriverAllowance,
            item.OtherCharges,
            item.Amount
        )).ToList();

        return new InvoiceResponseDto(
            i.Id,
            i.InvoiceNumber,
            i.InvoiceDate,
            i.DueDate,
            i.BillingMonth,
            i.ClientId,
            clientSnapshot,
            i.ContractRefNo,
            items,
            attachedIds,
            i.Subtotal,
            i.TaxType,
            i.TaxRate,
            i.Cgst,
            i.Sgst,
            i.Igst,
            i.IsInterstate,
            i.Discount,
            i.AdvanceReceived,
            i.TdsRate,
            i.TdsAmount,
            i.GrandTotal,
            i.NetPayable,
            i.AmountInWords,
            bankDetails,
            i.TradeLicenseNo,
            i.CompanyGstin,
            i.CompanyPan,
            i.CompanyPhone,
            i.CompanyEmail,
            i.CompanyAddress,
            i.Status,
            i.Notes,
            terms,
            i.CreatedAt.ToString("o")
        );
    }
}

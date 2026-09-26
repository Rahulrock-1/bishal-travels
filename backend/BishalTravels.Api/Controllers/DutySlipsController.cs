using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Services;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DutySlipsController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;
    private readonly ICalculationService _calcService;

    public DutySlipsController(BishalTravelsDbContext context, ICalculationService calcService)
    {
        _context = context;
        _calcService = calcService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DutySlip>>> GetDutySlips([FromQuery] string? status, [FromQuery] string? clientId, [FromQuery] string? vehicleId)
    {
        var query = _context.DutySlips.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(d => d.Status == status);
        }
        if (!string.IsNullOrWhiteSpace(clientId))
        {
            query = query.Where(d => d.ClientId == clientId);
        }
        if (!string.IsNullOrWhiteSpace(vehicleId))
        {
            query = query.Where(d => d.VehicleId == vehicleId);
        }

        var list = await query
            .OrderByDescending(d => d.Date)
            .ThenByDescending(d => d.DutySlipNo)
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("unbilled")]
    public async Task<ActionResult<IEnumerable<DutySlip>>> GetUnbilledDutySlips([FromQuery] string? clientId, [FromQuery] string? vehicleId)
    {
        var query = _context.DutySlips
            .Where(d => d.Status == "Pending" || string.IsNullOrEmpty(d.InvoiceId));

        if (!string.IsNullOrWhiteSpace(clientId))
        {
            query = query.Where(d => d.ClientId == clientId);
        }
        if (!string.IsNullOrWhiteSpace(vehicleId))
        {
            query = query.Where(d => d.VehicleId == vehicleId);
        }

        var list = await query
            .OrderBy(d => d.Date)
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DutySlip>> GetDutySlip(string id)
    {
        var dutySlip = await _context.DutySlips.FindAsync(id);
        if (dutySlip == null)
        {
            return NotFound(new { message = $"Duty Slip with ID {id} not found." });
        }
        return Ok(dutySlip);
    }

    [HttpPost]
    public async Task<ActionResult<DutySlip>> CreateDutySlip([FromBody] CreateDutySlipDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DutySlipNo))
        {
            return BadRequest(new { message = "Duty Slip Number is required." });
        }

        var cleanSlipNo = dto.DutySlipNo.Trim().ToUpper();
        if (await _context.DutySlips.AnyAsync(d => d.DutySlipNo == cleanSlipNo))
        {
            return Conflict(new { message = $"Duty Slip with number '{cleanSlipNo}' already exists." });
        }

        // Get vehicle standard hours if configured
        var vehicle = await _context.Vehicles.FindAsync(dto.VehicleId);
        var standardHours = vehicle?.DefaultDailyHours ?? 10.0m;

        var (totalKm, totalHours, extraHours) = _calcService.CalculateTripMetrics(
            dto.StartKm, dto.EndKm, dto.StartTime, dto.EndTime, standardHours);

        var dutySlip = new DutySlip
        {
            Id = $"ds-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}",
            DutySlipNo = cleanSlipNo,
            Date = dto.Date,
            VehicleId = dto.VehicleId,
            ClientId = dto.ClientId,
            Route = dto.Route.Trim(),
            DriverName = dto.DriverName.Trim(),
            StartKm = dto.StartKm,
            EndKm = dto.EndKm,
            TotalKm = totalKm,
            GarageOutKm = dto.GarageOutKm,
            GarageInKm = dto.GarageInKm,
            GarageKm = dto.GarageKm,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            TotalHours = totalHours,
            ExtraHours = extraHours,
            ExtraDuty = dto.ExtraDuty,
            ExtraDutyCharges = dto.ExtraDutyCharges,
            NightCharges = dto.NightCharges,
            ParkingCharges = dto.ParkingCharges,
            TollCharges = dto.TollCharges,
            DriverBatta = dto.DriverBatta,
            FuelCharges = dto.FuelCharges,
            OtherExpenses = dto.OtherExpenses,
            Notes = dto.Notes,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.DutySlips.Add(dutySlip);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDutySlip), new { id = dutySlip.Id }, dutySlip);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DutySlip>> UpdateDutySlip(string id, [FromBody] UpdateDutySlipDto dto)
    {
        var dutySlip = await _context.DutySlips.FindAsync(id);
        if (dutySlip == null)
        {
            return NotFound(new { message = $"Duty Slip with ID {id} not found." });
        }

        if (dto.DutySlipNo != null) dutySlip.DutySlipNo = dto.DutySlipNo.ToUpper();
        if (dto.Date != null) dutySlip.Date = dto.Date;
        if (dto.VehicleId != null) dutySlip.VehicleId = dto.VehicleId;
        if (dto.ClientId != null) dutySlip.ClientId = dto.ClientId;
        if (dto.Route != null) dutySlip.Route = dto.Route;
        if (dto.DriverName != null) dutySlip.DriverName = dto.DriverName;
        if (dto.StartKm.HasValue) dutySlip.StartKm = dto.StartKm.Value;
        if (dto.EndKm.HasValue) dutySlip.EndKm = dto.EndKm.Value;
        if (dto.GarageOutKm.HasValue) dutySlip.GarageOutKm = dto.GarageOutKm;
        if (dto.GarageInKm.HasValue) dutySlip.GarageInKm = dto.GarageInKm;
        if (dto.GarageKm.HasValue) dutySlip.GarageKm = dto.GarageKm;
        if (dto.StartTime != null) dutySlip.StartTime = dto.StartTime;
        if (dto.EndTime != null) dutySlip.EndTime = dto.EndTime;

        // Recalculate metrics
        var (totalKm, totalHours, extraHours) = _calcService.CalculateTripMetrics(
            dutySlip.StartKm, dutySlip.EndKm, dutySlip.StartTime, dutySlip.EndTime);
        dutySlip.TotalKm = totalKm;
        dutySlip.TotalHours = totalHours;
        dutySlip.ExtraHours = extraHours;

        if (dto.ExtraDuty != null) dutySlip.ExtraDuty = dto.ExtraDuty;
        if (dto.ExtraDutyCharges.HasValue) dutySlip.ExtraDutyCharges = dto.ExtraDutyCharges;
        if (dto.NightCharges.HasValue) dutySlip.NightCharges = dto.NightCharges.Value;
        if (dto.ParkingCharges.HasValue) dutySlip.ParkingCharges = dto.ParkingCharges.Value;
        if (dto.TollCharges.HasValue) dutySlip.TollCharges = dto.TollCharges.Value;
        if (dto.DriverBatta.HasValue) dutySlip.DriverBatta = dto.DriverBatta.Value;
        if (dto.FuelCharges.HasValue) dutySlip.FuelCharges = dto.FuelCharges.Value;
        if (dto.OtherExpenses.HasValue) dutySlip.OtherExpenses = dto.OtherExpenses.Value;
        if (dto.Notes != null) dutySlip.Notes = dto.Notes;
        if (dto.Status != null) dutySlip.Status = dto.Status;

        dutySlip.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(dutySlip);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteDutySlip(string id)
    {
        var dutySlip = await _context.DutySlips.FindAsync(id);
        if (dutySlip == null)
        {
            return NotFound(new { message = $"Duty Slip with ID {id} not found." });
        }

        _context.DutySlips.Remove(dutySlip);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

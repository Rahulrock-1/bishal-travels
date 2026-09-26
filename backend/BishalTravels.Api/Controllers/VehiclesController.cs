using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;
using BishalTravels.Api.DTOs;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;

    public VehiclesController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vehicle>>> GetVehicles()
    {
        var vehicles = await _context.Vehicles
            .OrderByDescending(v => v.Status == "Active")
            .ThenBy(v => v.RegNumber)
            .ToListAsync();
        return Ok(vehicles);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Vehicle>> GetVehicle(string id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
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

        var cleanReg = dto.RegNumber.Trim().ToUpper();
        if (await _context.Vehicles.AnyAsync(v => v.RegNumber == cleanReg))
        {
            return Conflict(new { message = $"Vehicle with Registration Number '{cleanReg}' already exists." });
        }

        var vehicle = new Vehicle
        {
            Id = $"veh-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}",
            RegNumber = cleanReg,
            Model = dto.Model.Trim(),
            Type = dto.Type,
            FuelType = dto.FuelType,
            DriverName = dto.DriverName.Trim(),
            DriverPhone = dto.DriverPhone.Trim(),
            DefaultDailyKm = dto.DefaultDailyKm,
            DefaultDailyHours = dto.DefaultDailyHours,
            BaseMonthlyRate = dto.BaseMonthlyRate,
            RatePerKm = dto.RatePerKm,
            RatePerHour = dto.RatePerHour,
            GarageRatePerKm = dto.GarageRatePerKm,
            NightChargeRate = dto.NightChargeRate,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetVehicle), new { id = vehicle.Id }, vehicle);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Vehicle>> UpdateVehicle(string id, [FromBody] UpdateVehicleDto dto)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found." });
        }

        if (!string.IsNullOrWhiteSpace(dto.RegNumber))
        {
            var cleanReg = dto.RegNumber.Trim().ToUpper();
            if (cleanReg != vehicle.RegNumber && await _context.Vehicles.AnyAsync(v => v.RegNumber == cleanReg && v.Id != id))
            {
                return Conflict(new { message = $"Another vehicle with Registration Number '{cleanReg}' already exists." });
            }
            vehicle.RegNumber = cleanReg;
        }

        if (dto.Model != null) vehicle.Model = dto.Model;
        if (dto.Type != null) vehicle.Type = dto.Type;
        if (dto.FuelType != null) vehicle.FuelType = dto.FuelType;
        if (dto.DriverName != null) vehicle.DriverName = dto.DriverName;
        if (dto.DriverPhone != null) vehicle.DriverPhone = dto.DriverPhone;
        if (dto.DefaultDailyKm.HasValue) vehicle.DefaultDailyKm = dto.DefaultDailyKm;
        if (dto.DefaultDailyHours.HasValue) vehicle.DefaultDailyHours = dto.DefaultDailyHours;
        if (dto.BaseMonthlyRate.HasValue) vehicle.BaseMonthlyRate = dto.BaseMonthlyRate.Value;
        if (dto.RatePerKm.HasValue) vehicle.RatePerKm = dto.RatePerKm.Value;
        if (dto.RatePerHour.HasValue) vehicle.RatePerHour = dto.RatePerHour.Value;
        if (dto.GarageRatePerKm.HasValue) vehicle.GarageRatePerKm = dto.GarageRatePerKm;
        if (dto.NightChargeRate.HasValue) vehicle.NightChargeRate = dto.NightChargeRate.Value;
        if (dto.Status != null) vehicle.Status = dto.Status;
        if (dto.Notes != null) vehicle.Notes = dto.Notes;

        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(vehicle);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteVehicle(string id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null)
        {
            return NotFound(new { message = $"Vehicle with ID {id} not found." });
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;

    public ReportsController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet("monthly")]
    public async Task<ActionResult> GetMonthlyReport([FromQuery] string? month)
    {
        var invoiceQuery = _context.Invoices.Include(i => i.Items).Include(i => i.Client).AsQueryable();
        var dutySlipQuery = _context.DutySlips.Include(d => d.Vehicle).Include(d => d.Client).AsQueryable();

        if (!string.IsNullOrWhiteSpace(month))
        {
            invoiceQuery = invoiceQuery.Where(i => i.BillingMonth.ToLower() == month.ToLower());
        }

        var invoices = await invoiceQuery.ToListAsync();
        var dutySlips = await dutySlipQuery.ToListAsync();

        var totalInvoicedAmount = invoices.Sum(i => i.NetPayable);
        var totalGrandTotal = invoices.Sum(i => i.GrandTotal);
        var totalGstAmount = invoices.Sum(i => i.Cgst + i.Sgst + i.Igst);
        var totalTdsAmount = invoices.Sum(i => i.TdsAmount);
        var totalAdvanceReceived = invoices.Sum(i => i.AdvanceReceived);
        
        var paidAmount = invoices.Where(i => i.Status == "Paid").Sum(i => i.NetPayable);
        var pendingAmount = invoices.Where(i => i.Status == "Sent" || i.Status == "Draft").Sum(i => i.NetPayable);
        var overdueAmount = invoices.Where(i => i.Status == "Overdue").Sum(i => i.NetPayable);

        var totalRunKm = dutySlips.Sum(d => d.TotalKm);
        var totalHours = dutySlips.Sum(d => d.TotalHours);
        var totalExtraHours = dutySlips.Sum(d => d.ExtraHours);
        var totalTolls = dutySlips.Sum(d => d.TollCharges);
        var totalParking = dutySlips.Sum(d => d.ParkingCharges);
        var totalNightCharges = dutySlips.Sum(d => d.NightCharges);
        var totalDriverBatta = dutySlips.Sum(d => d.DriverBatta);

        // Group by vehicle
        var vehiclePerformance = dutySlips
            .GroupBy(d => new { d.VehicleId, RegNumber = d.Vehicle != null ? d.Vehicle.RegNumber : d.VehicleId, Model = d.Vehicle != null ? d.Vehicle.Model : "" })
            .Select(g => new
            {
                VehicleId = g.Key.VehicleId,
                RegNumber = g.Key.RegNumber,
                Model = g.Key.Model,
                TripCount = g.Count(),
                TotalKm = g.Sum(x => x.TotalKm),
                TotalHours = g.Sum(x => x.TotalHours),
                ExtraHours = g.Sum(x => x.ExtraHours),
                Tolls = g.Sum(x => x.TollCharges),
                Parking = g.Sum(x => x.ParkingCharges),
                NightCharges = g.Sum(x => x.NightCharges),
                DriverBatta = g.Sum(x => x.DriverBatta)
            })
            .OrderByDescending(v => v.TotalKm)
            .ToList();

        // Group by client
        var clientPerformance = invoices
            .GroupBy(i => new { i.ClientId, CompanyName = i.Client != null ? i.Client.CompanyName : i.ClientId })
            .Select(g => new
            {
                ClientId = g.Key.ClientId,
                CompanyName = g.Key.CompanyName,
                InvoiceCount = g.Count(),
                TotalBilled = g.Sum(i => i.NetPayable),
                PaidAmount = g.Where(i => i.Status == "Paid").Sum(i => i.NetPayable),
                PendingAmount = g.Where(i => i.Status != "Paid").Sum(i => i.NetPayable)
            })
            .OrderByDescending(c => c.TotalBilled)
            .ToList();

        return Ok(new
        {
            Month = month ?? "All Time",
            Financials = new
            {
                TotalInvoices = invoices.Count,
                TotalInvoicedAmount = totalInvoicedAmount,
                TotalGrandTotal = totalGrandTotal,
                TotalGst = totalGstAmount,
                TotalTds = totalTdsAmount,
                TotalAdvance = totalAdvanceReceived,
                PaidAmount = paidAmount,
                PendingAmount = pendingAmount,
                OverdueAmount = overdueAmount
            },
            FleetOperations = new
            {
                TotalDutySlips = dutySlips.Count,
                TotalRunKm = totalRunKm,
                TotalHours = totalHours,
                TotalExtraHours = totalExtraHours,
                TotalTolls = totalTolls,
                TotalParking = totalParking,
                TotalNightCharges = totalNightCharges,
                TotalDriverBatta = totalDriverBatta
            },
            VehiclePerformance = vehiclePerformance,
            ClientPerformance = clientPerformance
        });
    }
}

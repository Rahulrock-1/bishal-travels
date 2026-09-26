using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;
using BishalTravels.Api.DTOs;

namespace BishalTravels.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BackupController : ControllerBase
{
    private readonly BishalTravelsDbContext _context;

    public BackupController(BishalTravelsDbContext context)
    {
        _context = context;
    }

    [HttpGet("export")]
    public async Task<ActionResult<AppStateDataDto>> ExportBackup()
    {
        var company = await _context.CompanyProfiles.FirstOrDefaultAsync() ?? new CompanyProfile();
        var vehicles = await _context.Vehicles.ToListAsync();
        var clients = await _context.Clients.ToListAsync();
        var dutySlips = await _context.DutySlips.ToListAsync();
        var invoices = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.Client)
            .ToListAsync();

        var companyDto = new CompanyProfileDto(
            company.BusinessName,
            company.Tagline,
            company.TradeLicenseNo,
            company.VendorId,
            company.Gstin,
            company.Pan,
            company.Address,
            company.Phone,
            company.Email,
            company.BankName,
            company.AccountHolder,
            company.AccountNumber,
            company.IfscCode,
            company.BranchName,
            company.UpiId,
            company.SignatoryName,
            company.SignatoryTitle,
            company.LogoUrl,
            company.DefaultTerms,
            company.IsConfigured
        );

        var invoiceDtos = invoices.Select(i =>
        {
            var clientSnapshot = JsonSerializer.Deserialize<Client>(i.ClientSnapshotJson) 
                ?? i.Client 
                ?? new Client { Id = i.ClientId, CompanyName = "Unknown" };

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
        }).ToList();

        var state = new AppStateDataDto(
            companyDto,
            vehicles,
            clients,
            dutySlips,
            invoiceDtos,
            true
        );

        return Ok(state);
    }

    [HttpPost("restore")]
    public async Task<ActionResult> RestoreBackup([FromBody] AppStateDataDto data)
    {
        if (data == null)
        {
            return BadRequest(new { message = "Invalid backup payload." });
        }

        // 1. Update company profile
        if (data.Company != null)
        {
            var company = await _context.CompanyProfiles.FirstOrDefaultAsync();
            if (company == null)
            {
                company = new CompanyProfile();
                _context.CompanyProfiles.Add(company);
            }
            company.BusinessName = data.Company.BusinessName;
            company.Tagline = data.Company.Tagline;
            company.TradeLicenseNo = data.Company.TradeLicenseNo;
            company.VendorId = data.Company.VendorId;
            company.Gstin = data.Company.Gstin;
            company.Pan = data.Company.Pan;
            company.Address = data.Company.Address;
            company.Phone = data.Company.Phone;
            company.Email = data.Company.Email;
            company.BankName = data.Company.BankName;
            company.AccountHolder = data.Company.AccountHolder;
            company.AccountNumber = data.Company.AccountNumber;
            company.IfscCode = data.Company.IfscCode;
            company.BranchName = data.Company.BranchName;
            company.UpiId = data.Company.UpiId;
            company.SignatoryName = data.Company.SignatoryName;
            company.SignatoryTitle = data.Company.SignatoryTitle;
            company.LogoUrl = data.Company.LogoUrl;
            company.DefaultTerms = data.Company.DefaultTerms;
            company.IsConfigured = true;
            company.UpdatedAt = DateTime.UtcNow;
        }

        // 2. Clear & Replace or Upsert Vehicles
        if (data.Vehicles != null)
        {
            foreach (var v in data.Vehicles)
            {
                var existing = await _context.Vehicles.FindAsync(v.Id);
                if (existing != null)
                {
                    _context.Entry(existing).CurrentValues.SetValues(v);
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.Vehicles.Add(v);
                }
            }
        }

        // 3. Clear & Replace or Upsert Clients
        if (data.Clients != null)
        {
            foreach (var c in data.Clients)
            {
                var existing = await _context.Clients.FindAsync(c.Id);
                if (existing != null)
                {
                    _context.Entry(existing).CurrentValues.SetValues(c);
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.Clients.Add(c);
                }
            }
        }

        // 4. Upsert Invoices & Items
        if (data.Invoices != null)
        {
            foreach (var invDto in data.Invoices)
            {
                var existingInv = await _context.Invoices.Include(i => i.Items).FirstOrDefaultAsync(i => i.Id == invDto.Id);
                if (existingInv == null)
                {
                    var newInv = new Invoice
                    {
                        Id = invDto.Id,
                        InvoiceNumber = invDto.InvoiceNumber,
                        InvoiceDate = invDto.InvoiceDate,
                        DueDate = invDto.DueDate,
                        BillingMonth = invDto.BillingMonth,
                        ClientId = invDto.ClientId,
                        ClientSnapshotJson = JsonSerializer.Serialize(invDto.ClientSnapshot),
                        ContractRefNo = invDto.ContractRefNo,
                        AttachedDutySlipIdsJson = JsonSerializer.Serialize(invDto.AttachedDutySlipIds ?? new List<string>()),
                        Subtotal = invDto.Subtotal,
                        TaxType = invDto.TaxType,
                        TaxRate = invDto.TaxRate,
                        Cgst = invDto.Cgst,
                        Sgst = invDto.Sgst,
                        Igst = invDto.Igst,
                        IsInterstate = invDto.IsInterstate,
                        Discount = invDto.Discount,
                        AdvanceReceived = invDto.AdvanceReceived,
                        TdsRate = invDto.TdsRate,
                        TdsAmount = invDto.TdsAmount,
                        GrandTotal = invDto.GrandTotal,
                        NetPayable = invDto.NetPayable,
                        AmountInWords = invDto.AmountInWords,
                        BankDetailsJson = JsonSerializer.Serialize(invDto.BankDetails),
                        TradeLicenseNo = invDto.TradeLicenseNo,
                        CompanyGstin = invDto.CompanyGstin,
                        CompanyPan = invDto.CompanyPan,
                        CompanyPhone = invDto.CompanyPhone,
                        CompanyEmail = invDto.CompanyEmail,
                        CompanyAddress = invDto.CompanyAddress,
                        Status = invDto.Status,
                        Notes = invDto.Notes,
                        TermsJson = JsonSerializer.Serialize(invDto.Terms ?? new List<string>()),
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    if (invDto.Items != null)
                    {
                        foreach (var it in invDto.Items)
                        {
                            newInv.Items.Add(new InvoiceItem
                            {
                                Id = it.Id,
                                InvoiceId = invDto.Id,
                                Description = it.Description,
                                VehicleRegNo = it.VehicleRegNo,
                                VehicleModel = it.VehicleModel,
                                BillingType = it.BillingType,
                                BasePackageAmount = it.BasePackageAmount,
                                TotalRunKm = it.TotalRunKm,
                                RatePerKm = it.RatePerKm,
                                KmCharges = it.KmCharges,
                                ExtraKm = it.ExtraKm,
                                ExtraKmRate = it.ExtraKmRate,
                                ExtraKmCharges = it.ExtraKmCharges,
                                ExtraHours = it.ExtraHours,
                                ExtraHourRate = it.ExtraHourRate,
                                ExtraHourCharges = it.ExtraHourCharges,
                                NightCharges = it.NightCharges,
                                ParkingCharges = it.ParkingCharges,
                                TollCharges = it.TollCharges,
                                DriverAllowance = it.DriverAllowance,
                                OtherCharges = it.OtherCharges,
                                Amount = it.Amount
                            });
                        }
                    }
                    _context.Invoices.Add(newInv);
                }
            }
        }

        // 5. Upsert Duty Slips
        if (data.DutySlips != null)
        {
            foreach (var ds in data.DutySlips)
            {
                var existingDs = await _context.DutySlips.FindAsync(ds.Id);
                if (existingDs != null)
                {
                    _context.Entry(existingDs).CurrentValues.SetValues(ds);
                    existingDs.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.DutySlips.Add(ds);
                }
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Backup state successfully restored to database." });
    }

    [HttpPost("reset")]
    public async Task<ActionResult> ResetDatabase()
    {
        _context.InvoiceItems.RemoveRange(_context.InvoiceItems);
        _context.DutySlips.RemoveRange(_context.DutySlips);
        _context.Invoices.RemoveRange(_context.Invoices);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Clients.RemoveRange(_context.Clients);
        _context.CompanyProfiles.RemoveRange(_context.CompanyProfiles);

        await _context.SaveChangesAsync();
        await DbInitializer.InitializeAsync(_context);

        return Ok(new { message = "Database successfully reset to initial Bishal Travels sample state." });
    }
}

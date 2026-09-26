using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Models;
using BishalTravels.Api.Repositories;
using BishalTravels.Api.Services.Interfaces;

namespace BishalTravels.Api.Services.Implementations;

// 1. Duty Slip Service
public class DutySlipService : IDutySlipService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICalculationService _calcService;

    public DutySlipService(IUnitOfWork unitOfWork, ICalculationService calcService)
    {
        _unitOfWork = unitOfWork;
        _calcService = calcService;
    }

    public async Task<IReadOnlyList<DutySlip>> GetDutySlipsAsync(string? status, string? clientId, string? vehicleId)
    {
        return await _unitOfWork.DutySlips.GetFilteredAsync(status, clientId, vehicleId);
    }

    public async Task<IReadOnlyList<DutySlip>> GetUnbilledDutySlipsAsync(string? clientId, string? vehicleId)
    {
        return await _unitOfWork.DutySlips.GetUnbilledAsync(clientId, vehicleId);
    }

    public async Task<DutySlip?> GetDutySlipByIdAsync(string id)
    {
        return await _unitOfWork.DutySlips.GetWithRelationsAsync(id);
    }

    public async Task<DutySlip> CreateDutySlipAsync(CreateDutySlipDto dto)
    {
        var cleanSlipNo = dto.DutySlipNo.Trim().ToUpper();
        if (await _unitOfWork.DutySlips.DutySlipNoExistsAsync(cleanSlipNo))
        {
            throw new InvalidOperationException($"Duty Slip number '{cleanSlipNo}' already exists.");
        }

        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(dto.VehicleId);
        if (vehicle == null)
        {
            throw new KeyNotFoundException($"Vehicle with ID '{dto.VehicleId}' does not exist.");
        }

        var client = await _unitOfWork.Clients.GetByIdAsync(dto.ClientId);
        if (client == null)
        {
            throw new KeyNotFoundException($"Client with ID '{dto.ClientId}' does not exist.");
        }

        var (totalKm, totalHours, extraHours) = _calcService.CalculateTripMetrics(
            dto.StartKm, 
            dto.EndKm, 
            dto.StartTime, 
            dto.EndTime, 
            vehicle.DefaultDailyHours ?? 10.0m
        );

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

        await _unitOfWork.DutySlips.AddAsync(dutySlip);
        await _unitOfWork.CommitAsync();

        return (await _unitOfWork.DutySlips.GetWithRelationsAsync(dutySlip.Id))!;
    }

    public async Task<DutySlip?> UpdateDutySlipAsync(string id, UpdateDutySlipDto dto)
    {
        var dutySlip = await _unitOfWork.DutySlips.GetByIdAsync(id);
        if (dutySlip == null) return null;

        if (dutySlip.Status == "Billed" && !string.IsNullOrEmpty(dutySlip.InvoiceId))
        {
            throw new InvalidOperationException("Cannot modify a Duty Slip that has already been billed to an invoice.");
        }

        if (!string.IsNullOrWhiteSpace(dto.DutySlipNo))
        {
            var cleanSlipNo = dto.DutySlipNo.Trim().ToUpper();
            if (await _unitOfWork.DutySlips.DutySlipNoExistsAsync(cleanSlipNo, id))
            {
                throw new InvalidOperationException($"Duty Slip number '{cleanSlipNo}' already exists on another duty slip.");
            }
            dutySlip.DutySlipNo = cleanSlipNo;
        }

        if (dto.Date != null) dutySlip.Date = dto.Date;
        if (dto.Route != null) dutySlip.Route = dto.Route.Trim();
        if (dto.DriverName != null) dutySlip.DriverName = dto.DriverName.Trim();

        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(dutySlip.VehicleId);
        var standardHours = vehicle?.DefaultDailyHours ?? 10.0m;

        var startKm = dto.StartKm ?? dutySlip.StartKm;
        var endKm = dto.EndKm ?? dutySlip.EndKm;
        var startTime = dto.StartTime ?? dutySlip.StartTime;
        var endTime = dto.EndTime ?? dutySlip.EndTime;

        var (totalKm, totalHours, extraHours) = _calcService.CalculateTripMetrics(startKm, endKm, startTime, endTime, standardHours);

        dutySlip.StartKm = startKm;
        dutySlip.EndKm = endKm;
        dutySlip.TotalKm = totalKm;
        dutySlip.StartTime = startTime;
        dutySlip.EndTime = endTime;
        dutySlip.TotalHours = totalHours;
        dutySlip.ExtraHours = extraHours;

        if (dto.GarageOutKm.HasValue) dutySlip.GarageOutKm = dto.GarageOutKm;
        if (dto.GarageInKm.HasValue) dutySlip.GarageInKm = dto.GarageInKm;
        if (dto.GarageKm.HasValue) dutySlip.GarageKm = dto.GarageKm;
        if (dto.ExtraDuty != null) dutySlip.ExtraDuty = dto.ExtraDuty;
        if (dto.ExtraDutyCharges.HasValue) dutySlip.ExtraDutyCharges = dto.ExtraDutyCharges;
        if (dto.NightCharges.HasValue) dutySlip.NightCharges = dto.NightCharges.Value;
        if (dto.ParkingCharges.HasValue) dutySlip.ParkingCharges = dto.ParkingCharges.Value;
        if (dto.TollCharges.HasValue) dutySlip.TollCharges = dto.TollCharges.Value;
        if (dto.DriverBatta.HasValue) dutySlip.DriverBatta = dto.DriverBatta.Value;
        if (dto.FuelCharges.HasValue) dutySlip.FuelCharges = dto.FuelCharges.Value;
        if (dto.OtherExpenses.HasValue) dutySlip.OtherExpenses = dto.OtherExpenses.Value;
        if (dto.Notes != null) dutySlip.Notes = dto.Notes;
        dutySlip.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.DutySlips.UpdateAsync(dutySlip);
        await _unitOfWork.CommitAsync();

        return await _unitOfWork.DutySlips.GetWithRelationsAsync(id);
    }

    public async Task<bool> DeleteDutySlipAsync(string id)
    {
        var dutySlip = await _unitOfWork.DutySlips.GetByIdAsync(id);
        if (dutySlip == null) return false;

        if (dutySlip.Status == "Billed" && !string.IsNullOrEmpty(dutySlip.InvoiceId))
        {
            throw new InvalidOperationException("Cannot delete a Duty Slip that has already been billed to an invoice.");
        }

        await _unitOfWork.DutySlips.DeleteAsync(dutySlip);
        await _unitOfWork.CommitAsync();
        return true;
    }
}

// 2. Invoice Service
public class InvoiceService : IInvoiceService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICalculationService _calcService;

    public InvoiceService(IUnitOfWork unitOfWork, ICalculationService calcService)
    {
        _unitOfWork = unitOfWork;
        _calcService = calcService;
    }

    public async Task<IReadOnlyList<InvoiceResponseDto>> GetInvoicesAsync(string? status, string? month, string? clientId)
    {
        var invoices = await _unitOfWork.Invoices.GetFilteredAsync(status, month, clientId);
        return invoices.Select(MapToResponseDto).ToList();
    }

    public async Task<InvoiceResponseDto?> GetInvoiceByIdAsync(string id)
    {
        var invoice = await _unitOfWork.Invoices.GetWithItemsAndClientAsync(id);
        return invoice == null ? null : MapToResponseDto(invoice);
    }

    public async Task<InvoiceResponseDto> CreateInvoiceAsync(CreateInvoiceRequestDto dto)
    {
        var client = await _unitOfWork.Clients.GetByIdAsync(dto.ClientId);
        if (client == null)
        {
            throw new KeyNotFoundException($"Client with ID '{dto.ClientId}' does not exist.");
        }

        var company = await _unitOfWork.CompanyProfiles.GetPrimaryProfileAsync() ?? new CompanyProfile();

        var invoiceNo = !string.IsNullOrWhiteSpace(dto.InvoiceNumber) 
            ? dto.InvoiceNumber.Trim().ToUpper()
            : $"BT/{DateTime.Now:yyyy}/{DateTime.Now:MM}/{(await _unitOfWork.Invoices.CountAsync() + 1):D3}";

        if (await _unitOfWork.Invoices.InvoiceNumberExistsAsync(invoiceNo))
        {
            throw new InvalidOperationException($"Invoice number '{invoiceNo}' already exists.");
        }

        var invoiceId = $"inv-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}";

        var (subtotal, cgst, sgst, igst, tdsAmount, grandTotal, netPayable, amountInWords) = 
            _calcService.CalculateInvoiceFinancials(
                dto.Subtotal,
                dto.TaxType,
                dto.TaxRate,
                dto.IsInterstate,
                dto.Discount,
                dto.AdvanceReceived,
                dto.TdsRate
            );

        var bankDetailsDto = new BankDetailsDto(
            company.BankName,
            company.AccountHolder,
            company.AccountNumber,
            company.IfscCode,
            company.BranchName,
            company.UpiId ?? ""
        );

        var invoice = new Invoice
        {
            Id = invoiceId,
            InvoiceNumber = invoiceNo,
            InvoiceDate = dto.InvoiceDate,
            DueDate = dto.DueDate,
            BillingMonth = dto.BillingMonth,
            ClientId = dto.ClientId,
            ClientSnapshotJson = JsonSerializer.Serialize(client),
            ContractRefNo = dto.ContractRefNo ?? client.ContractRefNo,
            AttachedDutySlipIdsJson = JsonSerializer.Serialize(dto.AttachedDutySlipIds ?? new List<string>()),
            Subtotal = subtotal,
            TaxType = dto.TaxType,
            TaxRate = dto.TaxRate,
            Cgst = cgst,
            Sgst = sgst,
            Igst = igst,
            IsInterstate = dto.IsInterstate,
            Discount = dto.Discount,
            AdvanceReceived = dto.AdvanceReceived,
            TdsRate = dto.TdsRate,
            TdsAmount = tdsAmount,
            GrandTotal = grandTotal,
            NetPayable = netPayable,
            AmountInWords = amountInWords,
            BankDetailsJson = JsonSerializer.Serialize(bankDetailsDto),
            TradeLicenseNo = company.TradeLicenseNo,
            CompanyGstin = company.Gstin,
            CompanyPan = company.Pan,
            CompanyPhone = company.Phone,
            CompanyEmail = company.Email,
            CompanyAddress = company.Address,
            Status = "Generated",
            Notes = dto.Notes ?? "",
            TermsJson = JsonSerializer.Serialize(dto.Terms ?? company.DefaultTerms.ToList()),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var itemDto in dto.Items)
            {
                invoice.Items.Add(new InvoiceItem
                {
                    Id = $"item-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}",
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

        await _unitOfWork.Invoices.AddAsync(invoice);

        // Mark attached duty slips as Billed
        if (dto.AttachedDutySlipIds != null && dto.AttachedDutySlipIds.Any())
        {
            var dutySlips = await _unitOfWork.DutySlips.FindAsync(d => dto.AttachedDutySlipIds.Contains(d.Id));
            foreach (var slip in dutySlips)
            {
                slip.Status = "Billed";
                slip.InvoiceId = invoiceId;
                await _unitOfWork.DutySlips.UpdateAsync(slip);
            }
        }

        await _unitOfWork.CommitAsync();

        var createdInvoice = await _unitOfWork.Invoices.GetWithItemsAndClientAsync(invoiceId);
        return MapToResponseDto(createdInvoice!);
    }

    public async Task<InvoiceResponseDto?> UpdateInvoiceAsync(string id, UpdateInvoiceRequestDto dto)
    {
        var invoice = await _unitOfWork.Invoices.GetWithItemsAndClientAsync(id);
        if (invoice == null) return null;

        if (dto.InvoiceDate != null) invoice.InvoiceDate = dto.InvoiceDate;
        if (dto.DueDate != null) invoice.DueDate = dto.DueDate;
        if (dto.BillingMonth != null) invoice.BillingMonth = dto.BillingMonth;
        if (dto.ContractRefNo != null) invoice.ContractRefNo = dto.ContractRefNo;
        if (dto.Notes != null) invoice.Notes = dto.Notes;
        if (dto.Status != null) invoice.Status = dto.Status;

        if (dto.Subtotal.HasValue || dto.Discount.HasValue || dto.AdvanceReceived.HasValue || dto.TdsRate.HasValue)
        {
            var subtotalIn = dto.Subtotal ?? invoice.Subtotal;
            var taxTypeIn = dto.TaxType ?? invoice.TaxType;
            var taxRateIn = dto.TaxRate ?? invoice.TaxRate;
            var isInterstateIn = dto.IsInterstate ?? invoice.IsInterstate;
            var discountIn = dto.Discount ?? invoice.Discount;
            var advanceIn = dto.AdvanceReceived ?? invoice.AdvanceReceived;
            var tdsRateIn = dto.TdsRate ?? invoice.TdsRate;

            var (subtotal, cgst, sgst, igst, tdsAmount, grandTotal, netPayable, amountInWords) = 
                _calcService.CalculateInvoiceFinancials(
                    subtotalIn,
                    taxTypeIn,
                    taxRateIn,
                    isInterstateIn,
                    discountIn,
                    advanceIn,
                    tdsRateIn
                );

            invoice.Subtotal = subtotal;
            invoice.TaxType = taxTypeIn;
            invoice.TaxRate = taxRateIn;
            invoice.IsInterstate = isInterstateIn;
            invoice.Cgst = cgst;
            invoice.Sgst = sgst;
            invoice.Igst = igst;
            invoice.Discount = discountIn;
            invoice.AdvanceReceived = advanceIn;
            invoice.TdsRate = tdsRateIn;
            invoice.TdsAmount = tdsAmount;
            invoice.GrandTotal = grandTotal;
            invoice.NetPayable = netPayable;
            invoice.AmountInWords = amountInWords;
        }

        invoice.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Invoices.UpdateAsync(invoice);
        await _unitOfWork.CommitAsync();

        return MapToResponseDto(invoice);
    }

    public async Task<bool> UpdateInvoiceStatusAsync(string id, string status)
    {
        var invoice = await _unitOfWork.Invoices.GetByIdAsync(id);
        if (invoice == null) return false;

        invoice.Status = status;
        invoice.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Invoices.UpdateAsync(invoice);
        await _unitOfWork.CommitAsync();
        return true;
    }

    public async Task<bool> DeleteInvoiceAsync(string id)
    {
        var invoice = await _unitOfWork.Invoices.GetByIdAsync(id);
        if (invoice == null) return false;

        // Reset attached duty slips
        var attachedSlips = await _unitOfWork.DutySlips.FindAsync(d => d.InvoiceId == id);
        foreach (var slip in attachedSlips)
        {
            slip.Status = "Pending";
            slip.InvoiceId = null;
            await _unitOfWork.DutySlips.UpdateAsync(slip);
        }

        await _unitOfWork.Invoices.DeleteAsync(invoice);
        await _unitOfWork.CommitAsync();
        return true;
    }

    private static InvoiceResponseDto MapToResponseDto(Invoice i)
    {
        Client clientSnapshot;
        try { clientSnapshot = JsonSerializer.Deserialize<Client>(i.ClientSnapshotJson) ?? i.Client ?? new Client { Id = i.ClientId, CompanyName = "Unknown Client" }; }
        catch { clientSnapshot = i.Client ?? new Client { Id = i.ClientId, CompanyName = "Unknown Client" }; }

        List<string> attachedIds;
        try { attachedIds = JsonSerializer.Deserialize<List<string>>(i.AttachedDutySlipIdsJson) ?? new List<string>(); }
        catch { attachedIds = new List<string>(); }

        BankDetailsDto bankDetails;
        try { bankDetails = JsonSerializer.Deserialize<BankDetailsDto>(i.BankDetailsJson) ?? new BankDetailsDto("", "", "", "", "", ""); }
        catch { bankDetails = new BankDetailsDto("", "", "", "", "", ""); }

        List<string> terms;
        try { terms = JsonSerializer.Deserialize<List<string>>(i.TermsJson) ?? new List<string>(); }
        catch { terms = new List<string>(); }

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

// 3. Report Service
public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<object> GetMonthlyReportAsync(string? month)
    {
        var invoices = await _unitOfWork.Invoices.GetFilteredAsync(null, month, null);
        var dutySlips = await _unitOfWork.DutySlips.GetFilteredAsync(null, null, null);

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
                NightCharges = g.Sum(x => x.NightCharges)
            })
            .OrderByDescending(v => v.TotalKm)
            .ToList();

        var clientPerformance = dutySlips
            .GroupBy(d => new { d.ClientId, CompanyName = d.Client != null ? d.Client.CompanyName : d.ClientId })
            .Select(g => new
            {
                ClientId = g.Key.ClientId,
                CompanyName = g.Key.CompanyName,
                TripCount = g.Count(),
                TotalKm = g.Sum(x => x.TotalKm),
                TotalHours = g.Sum(x => x.TotalHours)
            })
            .OrderByDescending(c => c.TripCount)
            .ToList();

        return new
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
        };
    }
}

// 4. Backup Service
public class BackupService : IBackupService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly BishalTravelsDbContext _context;

    public BackupService(IUnitOfWork unitOfWork, BishalTravelsDbContext context)
    {
        _unitOfWork = unitOfWork;
        _context = context;
    }

    public async Task<AppStateDataDto> ExportBackupAsync()
    {
        var company = await _unitOfWork.CompanyProfiles.GetPrimaryProfileAsync() ?? new CompanyProfile();
        var vehicles = await _unitOfWork.Vehicles.GetAllAsync();
        var clients = await _unitOfWork.Clients.GetAllAsync();
        var dutySlips = await _unitOfWork.DutySlips.GetAllAsync();
        var invoices = await _unitOfWork.Invoices.GetFilteredAsync(null, null, null);

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
            Client clientSnapshot;
            try { clientSnapshot = JsonSerializer.Deserialize<Client>(i.ClientSnapshotJson) ?? i.Client ?? new Client { Id = i.ClientId, CompanyName = "Unknown" }; }
            catch { clientSnapshot = i.Client ?? new Client { Id = i.ClientId, CompanyName = "Unknown" }; }

            BankDetailsDto bankDetails;
            try { bankDetails = JsonSerializer.Deserialize<BankDetailsDto>(i.BankDetailsJson) ?? new BankDetailsDto("", "", "", "", "", ""); }
            catch { bankDetails = new BankDetailsDto("", "", "", "", "", ""); }

            List<string> attachedIds;
            try { attachedIds = JsonSerializer.Deserialize<List<string>>(i.AttachedDutySlipIdsJson) ?? new List<string>(); }
            catch { attachedIds = new List<string>(); }

            List<string> terms;
            try { terms = JsonSerializer.Deserialize<List<string>>(i.TermsJson) ?? new List<string>(); }
            catch { terms = new List<string>(); }

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

        return new AppStateDataDto(
            companyDto,
            vehicles.ToList(),
            clients.ToList(),
            dutySlips.ToList(),
            invoiceDtos,
            true
        );
    }

    public async Task<bool> RestoreBackupAsync(AppStateDataDto dto)
    {
        // Clear existing records
        _context.InvoiceItems.RemoveRange(_context.InvoiceItems);
        _context.Invoices.RemoveRange(_context.Invoices);
        _context.DutySlips.RemoveRange(_context.DutySlips);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Clients.RemoveRange(_context.Clients);
        await _context.SaveChangesAsync();

        // Restore Company Profile
        if (dto.Company != null)
        {
            var existingProfile = await _context.CompanyProfiles.FirstOrDefaultAsync();
            if (existingProfile == null)
            {
                existingProfile = new CompanyProfile();
                await _context.CompanyProfiles.AddAsync(existingProfile);
            }

            existingProfile.BusinessName = dto.Company.BusinessName;
            existingProfile.Tagline = dto.Company.Tagline;
            existingProfile.TradeLicenseNo = dto.Company.TradeLicenseNo;
            existingProfile.VendorId = dto.Company.VendorId;
            existingProfile.Gstin = dto.Company.Gstin;
            existingProfile.Pan = dto.Company.Pan;
            existingProfile.Address = dto.Company.Address;
            existingProfile.Phone = dto.Company.Phone;
            existingProfile.Email = dto.Company.Email;
            existingProfile.BankName = dto.Company.BankName;
            existingProfile.AccountHolder = dto.Company.AccountHolder;
            existingProfile.AccountNumber = dto.Company.AccountNumber;
            existingProfile.IfscCode = dto.Company.IfscCode;
            existingProfile.BranchName = dto.Company.BranchName;
            existingProfile.UpiId = dto.Company.UpiId;
            existingProfile.SignatoryName = dto.Company.SignatoryName;
            existingProfile.SignatoryTitle = dto.Company.SignatoryTitle;
            existingProfile.LogoUrl = dto.Company.LogoUrl;
            existingProfile.DefaultTerms = dto.Company.DefaultTerms;
            existingProfile.IsConfigured = true;
            existingProfile.UpdatedAt = DateTime.UtcNow;
        }

        // Restore Vehicles
        if (dto.Vehicles != null && dto.Vehicles.Any())
        {
            await _context.Vehicles.AddRangeAsync(dto.Vehicles);
        }

        // Restore Clients
        if (dto.Clients != null && dto.Clients.Any())
        {
            await _context.Clients.AddRangeAsync(dto.Clients);
        }

        // Restore Invoices
        if (dto.Invoices != null && dto.Invoices.Any())
        {
            foreach (var invDto in dto.Invoices)
            {
                var inv = new Invoice
                {
                    Id = invDto.Id,
                    InvoiceNumber = invDto.InvoiceNumber,
                    InvoiceDate = invDto.InvoiceDate,
                    DueDate = invDto.DueDate,
                    BillingMonth = invDto.BillingMonth,
                    ClientId = invDto.ClientId,
                    ClientSnapshotJson = JsonSerializer.Serialize(invDto.ClientSnapshot),
                    ContractRefNo = invDto.ContractRefNo,
                    AttachedDutySlipIdsJson = JsonSerializer.Serialize(invDto.AttachedDutySlipIds),
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
                    TermsJson = JsonSerializer.Serialize(invDto.Terms),
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                if (invDto.Items != null && invDto.Items.Any())
                {
                    foreach (var item in invDto.Items)
                    {
                        inv.Items.Add(new InvoiceItem
                        {
                            Id = item.Id,
                            InvoiceId = inv.Id,
                            Description = item.Description,
                            VehicleRegNo = item.VehicleRegNo,
                            VehicleModel = item.VehicleModel,
                            BillingType = item.BillingType,
                            BasePackageAmount = item.BasePackageAmount,
                            TotalRunKm = item.TotalRunKm,
                            RatePerKm = item.RatePerKm,
                            KmCharges = item.KmCharges,
                            ExtraKm = item.ExtraKm,
                            ExtraKmRate = item.ExtraKmRate,
                            ExtraKmCharges = item.ExtraKmCharges,
                            ExtraHours = item.ExtraHours,
                            ExtraHourRate = item.ExtraHourRate,
                            ExtraHourCharges = item.ExtraHourCharges,
                            NightCharges = item.NightCharges,
                            ParkingCharges = item.ParkingCharges,
                            TollCharges = item.TollCharges,
                            DriverAllowance = item.DriverAllowance,
                            OtherCharges = item.OtherCharges,
                            Amount = item.Amount
                        });
                    }
                }

                await _context.Invoices.AddAsync(inv);
            }
        }

        // Restore Duty Slips
        if (dto.DutySlips != null && dto.DutySlips.Any())
        {
            await _context.DutySlips.AddRangeAsync(dto.DutySlips);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ResetToSampleDataAsync()
    {
        _context.InvoiceItems.RemoveRange(_context.InvoiceItems);
        _context.Invoices.RemoveRange(_context.Invoices);
        _context.DutySlips.RemoveRange(_context.DutySlips);
        _context.Vehicles.RemoveRange(_context.Vehicles);
        _context.Clients.RemoveRange(_context.Clients);
        _context.CompanyProfiles.RemoveRange(_context.CompanyProfiles);
        _context.Users.RemoveRange(_context.Users);
        await _context.SaveChangesAsync();

        await DbInitializer.InitializeAsync(_context);
        return true;
    }
}

// 5. Auth Service
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;

    public AuthService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return new LoginResponse(false, "Email and password are required.", null, null);
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        // 1. Check database users
        var user = await _unitOfWork.Users.GetByEmailAsync(normalizedEmail);
        if (user != null && DbInitializer.VerifyPassword(request.Password, user.PasswordHash))
        {
            var authUser = new AuthUserDto(user.Name, user.Email, user.Role);
            var token = Guid.NewGuid().ToString("N");
            return new LoginResponse(true, null, authUser, token);
        }

        // 2. Master fallback
        if (normalizedEmail == "biswajitpramanikrock@gmail.com" && request.Password == "Biswajit@1989")
        {
            var authUser = new AuthUserDto("Biswajit Pramanik", "biswajitpramanikrock@gmail.com", "Administrator / Owner");
            var token = Guid.NewGuid().ToString("N");
            return new LoginResponse(true, null, authUser, token);
        }

        return new LoginResponse(false, "Invalid email address or password.", null, null);
    }

    public Task<AuthUserDto> GetCurrentUserAsync()
    {
        return Task.FromResult(new AuthUserDto("Biswajit Pramanik", "biswajitpramanikrock@gmail.com", "Administrator / Owner"));
    }
}

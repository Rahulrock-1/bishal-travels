using BishalTravels.Api.Models;

namespace BishalTravels.Api.DTOs;

// --- Auth DTOs ---
public record LoginRequest(string Email, string Password);
public record AuthUserDto(string Name, string Email, string Role);
public record LoginResponse(bool Success, string? Error, AuthUserDto? User, string? Token);

// --- Company Profile DTOs ---
public record CompanyProfileDto(
    string BusinessName,
    string Tagline,
    string TradeLicenseNo,
    string? VendorId,
    string Gstin,
    string Pan,
    string Address,
    string Phone,
    string Email,
    string BankName,
    string AccountHolder,
    string AccountNumber,
    string IfscCode,
    string BranchName,
    string UpiId,
    string SignatoryName,
    string SignatoryTitle,
    string? LogoUrl,
    string[] DefaultTerms,
    bool IsConfigured
);

// --- Vehicle DTOs ---
public record CreateVehicleDto(
    string RegNumber,
    string Model,
    string Type,
    string FuelType,
    string DriverName,
    string DriverPhone,
    decimal? DefaultDailyKm,
    decimal? DefaultDailyHours,
    decimal BaseMonthlyRate,
    decimal RatePerKm,
    decimal RatePerHour,
    decimal? GarageRatePerKm,
    decimal NightChargeRate,
    string Status,
    string? Notes
);

public record UpdateVehicleDto(
    string? RegNumber,
    string? Model,
    string? Type,
    string? FuelType,
    string? DriverName,
    string? DriverPhone,
    decimal? DefaultDailyKm,
    decimal? DefaultDailyHours,
    decimal? BaseMonthlyRate,
    decimal? RatePerKm,
    decimal? RatePerHour,
    decimal? GarageRatePerKm,
    decimal? NightChargeRate,
    string? Status,
    string? Notes
);

// --- Client DTOs ---
public record CreateClientDto(
    string Name,
    string CompanyName,
    string Gstin,
    string? Pan,
    string Address,
    string Phone,
    string Email,
    string ContractRefNo,
    string? ContractStartDate,
    string? ContractEndDate,
    int PaymentTermsDays,
    string? Notes
);

public record UpdateClientDto(
    string? Name,
    string? CompanyName,
    string? Gstin,
    string? Pan,
    string? Address,
    string? Phone,
    string? Email,
    string? ContractRefNo,
    string? ContractStartDate,
    string? ContractEndDate,
    int? PaymentTermsDays,
    string? Notes
);

// --- Duty Slip DTOs ---
public record CreateDutySlipDto(
    string DutySlipNo,
    string Date,
    string VehicleId,
    string ClientId,
    string Route,
    string DriverName,
    decimal StartKm,
    decimal EndKm,
    decimal? GarageOutKm,
    decimal? GarageInKm,
    decimal? GarageKm,
    string StartTime,
    string EndTime,
    string? ExtraDuty,
    decimal? ExtraDutyCharges,
    decimal NightCharges,
    decimal ParkingCharges,
    decimal TollCharges,
    decimal DriverBatta,
    decimal FuelCharges,
    decimal OtherExpenses,
    string? Notes
);

public record UpdateDutySlipDto(
    string? DutySlipNo,
    string? Date,
    string? VehicleId,
    string? ClientId,
    string? Route,
    string? DriverName,
    decimal? StartKm,
    decimal? EndKm,
    decimal? GarageOutKm,
    decimal? GarageInKm,
    decimal? GarageKm,
    string? StartTime,
    string? EndTime,
    string? ExtraDuty,
    decimal? ExtraDutyCharges,
    decimal? NightCharges,
    decimal? ParkingCharges,
    decimal? TollCharges,
    decimal? DriverBatta,
    decimal? FuelCharges,
    decimal? OtherExpenses,
    string? Notes,
    string? Status
);

public record UpsertDutySlipDto(
    string? Id,
    string DutySlipNo,
    string Date,
    string VehicleId,
    string ClientId,
    string Route,
    string DriverName,
    decimal StartKm,
    decimal EndKm,
    decimal? GarageOutKm,
    decimal? GarageInKm,
    decimal? GarageKm,
    string StartTime,
    string EndTime,
    string? ExtraDuty,
    decimal? ExtraDutyCharges,
    decimal NightCharges,
    decimal ParkingCharges,
    decimal TollCharges,
    decimal DriverBatta,
    decimal FuelCharges,
    decimal OtherExpenses,
    string? Notes,
    string? Status
);

public record BatchUpsertDutySlipsDto(List<UpsertDutySlipDto> Slips);

// --- Invoice DTOs ---
public record InvoiceItemDto(
    string Id,
    string Description,
    string? VehicleRegNo,
    string? VehicleModel,
    string BillingType,
    decimal BasePackageAmount,
    decimal TotalRunKm,
    decimal RatePerKm,
    decimal KmCharges,
    decimal ExtraKm,
    decimal ExtraKmRate,
    decimal ExtraKmCharges,
    decimal ExtraHours,
    decimal ExtraHourRate,
    decimal ExtraHourCharges,
    decimal NightCharges,
    decimal ParkingCharges,
    decimal TollCharges,
    decimal DriverAllowance,
    decimal OtherCharges,
    decimal Amount
);

public record CreateInvoiceDto(
    string InvoiceNumber,
    string InvoiceDate,
    string DueDate,
    string BillingMonth,
    string ClientId,
    Client ClientSnapshot,
    string ContractRefNo,
    List<InvoiceItemDto> Items,
    List<string> AttachedDutySlipIds,
    decimal Subtotal,
    string TaxType,
    decimal TaxRate,
    decimal Cgst,
    decimal Sgst,
    decimal Igst,
    bool IsInterstate,
    decimal Discount,
    decimal AdvanceReceived,
    decimal TdsRate,
    decimal TdsAmount,
    decimal GrandTotal,
    decimal NetPayable,
    string AmountInWords,
    BankDetailsDto BankDetails,
    string TradeLicenseNo,
    string CompanyGstin,
    string CompanyPan,
    string CompanyPhone,
    string CompanyEmail,
    string CompanyAddress,
    string Status,
    string Notes,
    List<string> Terms
);

public record BankDetailsDto(
    string BankName,
    string AccountHolder,
    string AccountNumber,
    string IfscCode,
    string BranchName,
    string UpiId
);

public record UpdateInvoiceStatusDto(string Status);

public record CreateInvoiceRequestDto(
    string? InvoiceNumber,
    string InvoiceDate,
    string DueDate,
    string BillingMonth,
    string ClientId,
    string? ContractRefNo,
    List<InvoiceItemDto>? Items,
    List<string>? AttachedDutySlipIds,
    decimal Subtotal,
    string TaxType,
    decimal TaxRate,
    bool IsInterstate,
    decimal Discount,
    decimal AdvanceReceived,
    decimal TdsRate,
    decimal TdsAmount,
    string? Notes,
    List<string>? Terms
);

public record UpdateInvoiceRequestDto(
    string? InvoiceDate,
    string? DueDate,
    string? BillingMonth,
    string? ContractRefNo,
    decimal? Subtotal,
    string? TaxType,
    decimal? TaxRate,
    bool? IsInterstate,
    decimal? Discount,
    decimal? AdvanceReceived,
    decimal? TdsRate,
    string? Notes,
    string? Status
);

// --- Full App State / Backup DTO ---
public record AppStateDataDto(
    CompanyProfileDto Company,
    List<Vehicle> Vehicles,
    List<Client> Clients,
    List<DutySlip> DutySlips,
    List<InvoiceResponseDto> Invoices,
    bool SetupCompleted
);

public record InvoiceResponseDto(
    string Id,
    string InvoiceNumber,
    string InvoiceDate,
    string DueDate,
    string BillingMonth,
    string ClientId,
    Client ClientSnapshot,
    string ContractRefNo,
    List<InvoiceItemDto> Items,
    List<string> AttachedDutySlipIds,
    decimal Subtotal,
    string TaxType,
    decimal TaxRate,
    decimal Cgst,
    decimal Sgst,
    decimal Igst,
    bool IsInterstate,
    decimal Discount,
    decimal AdvanceReceived,
    decimal TdsRate,
    decimal TdsAmount,
    decimal GrandTotal,
    decimal NetPayable,
    string AmountInWords,
    BankDetailsDto BankDetails,
    string TradeLicenseNo,
    string CompanyGstin,
    string CompanyPan,
    string CompanyPhone,
    string CompanyEmail,
    string CompanyAddress,
    string Status,
    string Notes,
    List<string> Terms,
    string CreatedAt
);

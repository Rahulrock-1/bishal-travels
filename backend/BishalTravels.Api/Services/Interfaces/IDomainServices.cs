using BishalTravels.Api.DTOs;
using BishalTravels.Api.Models;

namespace BishalTravels.Api.Services.Interfaces;

public interface ICompanyService
{
    Task<CompanyProfileDto> GetProfileAsync();
    Task<CompanyProfileDto> UpdateProfileAsync(CompanyProfileDto dto);
}

public interface IVehicleService
{
    Task<IReadOnlyList<Vehicle>> GetAllVehiclesAsync();
    Task<Vehicle?> GetVehicleByIdAsync(string id);
    Task<Vehicle> CreateVehicleAsync(CreateVehicleDto dto);
    Task<Vehicle?> UpdateVehicleAsync(string id, UpdateVehicleDto dto);
    Task<bool> DeleteVehicleAsync(string id);
}

public interface IClientService
{
    Task<IReadOnlyList<Client>> GetAllClientsAsync();
    Task<Client?> GetClientByIdAsync(string id);
    Task<Client> CreateClientAsync(CreateClientDto dto);
    Task<Client?> UpdateClientAsync(string id, UpdateClientDto dto);
    Task<bool> DeleteClientAsync(string id);
}

public interface IDutySlipService
{
    Task<IReadOnlyList<DutySlip>> GetDutySlipsAsync(string? status, string? clientId, string? vehicleId);
    Task<IReadOnlyList<DutySlip>> GetUnbilledDutySlipsAsync(string? clientId, string? vehicleId);
    Task<DutySlip?> GetDutySlipByIdAsync(string id);
    Task<DutySlip> CreateDutySlipAsync(CreateDutySlipDto dto);
    Task<DutySlip?> UpdateDutySlipAsync(string id, UpdateDutySlipDto dto);
    Task<bool> DeleteDutySlipAsync(string id);
}

public interface IInvoiceService
{
    Task<IReadOnlyList<InvoiceResponseDto>> GetInvoicesAsync(string? status, string? month, string? clientId);
    Task<InvoiceResponseDto?> GetInvoiceByIdAsync(string id);
    Task<InvoiceResponseDto> CreateInvoiceAsync(CreateInvoiceRequestDto dto);
    Task<InvoiceResponseDto?> UpdateInvoiceAsync(string id, UpdateInvoiceRequestDto dto);
    Task<bool> UpdateInvoiceStatusAsync(string id, string status);
    Task<bool> DeleteInvoiceAsync(string id);
}

public interface IReportService
{
    Task<object> GetMonthlyReportAsync(string? month);
}

public interface IBackupService
{
    Task<AppStateDataDto> ExportBackupAsync();
    Task<bool> RestoreBackupAsync(AppStateDataDto dto);
    Task<bool> ResetToSampleDataAsync();
}

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<AuthUserDto> GetCurrentUserAsync();
}

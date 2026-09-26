using BishalTravels.Api.DTOs;
using BishalTravels.Api.Models;
using BishalTravels.Api.Repositories;
using BishalTravels.Api.Services.Interfaces;

namespace BishalTravels.Api.Services.Implementations;

public class CompanyService : ICompanyService
{
    private readonly IUnitOfWork _unitOfWork;

    public CompanyService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CompanyProfileDto> GetProfileAsync()
    {
        var profile = await _unitOfWork.CompanyProfiles.GetPrimaryProfileAsync();
        if (profile == null)
        {
            profile = new CompanyProfile();
            await _unitOfWork.CompanyProfiles.AddAsync(profile);
            await _unitOfWork.CommitAsync();
        }

        return MapToDto(profile);
    }

    public async Task<CompanyProfileDto> UpdateProfileAsync(CompanyProfileDto dto)
    {
        var profile = await _unitOfWork.CompanyProfiles.GetPrimaryProfileAsync();
        if (profile == null)
        {
            profile = new CompanyProfile();
            await _unitOfWork.CompanyProfiles.AddAsync(profile);
        }

        profile.BusinessName = dto.BusinessName ?? profile.BusinessName;
        profile.Tagline = dto.Tagline ?? profile.Tagline;
        profile.TradeLicenseNo = dto.TradeLicenseNo ?? profile.TradeLicenseNo;
        profile.VendorId = dto.VendorId ?? profile.VendorId;
        profile.Gstin = dto.Gstin ?? profile.Gstin;
        profile.Pan = dto.Pan ?? profile.Pan;
        profile.Address = dto.Address ?? profile.Address;
        profile.Phone = dto.Phone ?? profile.Phone;
        profile.Email = dto.Email ?? profile.Email;
        profile.BankName = dto.BankName ?? profile.BankName;
        profile.AccountHolder = dto.AccountHolder ?? profile.AccountHolder;
        profile.AccountNumber = dto.AccountNumber ?? profile.AccountNumber;
        profile.IfscCode = dto.IfscCode ?? profile.IfscCode;
        profile.BranchName = dto.BranchName ?? profile.BranchName;
        profile.UpiId = dto.UpiId ?? profile.UpiId;
        profile.SignatoryName = dto.SignatoryName ?? profile.SignatoryName;
        profile.SignatoryTitle = dto.SignatoryTitle ?? profile.SignatoryTitle;
        profile.LogoUrl = dto.LogoUrl ?? profile.LogoUrl;
        profile.DefaultTerms = dto.DefaultTerms ?? profile.DefaultTerms;
        profile.IsConfigured = true;
        profile.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.CompanyProfiles.UpdateAsync(profile);
        await _unitOfWork.CommitAsync();

        return MapToDto(profile);
    }

    private static CompanyProfileDto MapToDto(CompanyProfile p) => new(
        p.BusinessName,
        p.Tagline,
        p.TradeLicenseNo,
        p.VendorId,
        p.Gstin,
        p.Pan,
        p.Address,
        p.Phone,
        p.Email,
        p.BankName,
        p.AccountHolder,
        p.AccountNumber,
        p.IfscCode,
        p.BranchName,
        p.UpiId,
        p.SignatoryName,
        p.SignatoryTitle,
        p.LogoUrl,
        p.DefaultTerms,
        p.IsConfigured
    );
}

public class VehicleService : IVehicleService
{
    private readonly IUnitOfWork _unitOfWork;

    public VehicleService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<Vehicle>> GetAllVehiclesAsync()
    {
        return await _unitOfWork.Vehicles.GetOrderedFleetAsync();
    }

    public async Task<Vehicle?> GetVehicleByIdAsync(string id)
    {
        return await _unitOfWork.Vehicles.GetByIdAsync(id);
    }

    public async Task<Vehicle> CreateVehicleAsync(CreateVehicleDto dto)
    {
        var cleanReg = dto.RegNumber.Trim().ToUpper();
        if (await _unitOfWork.Vehicles.RegNumberExistsAsync(cleanReg))
        {
            throw new InvalidOperationException($"Vehicle with Registration Number '{cleanReg}' already exists.");
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

        await _unitOfWork.Vehicles.AddAsync(vehicle);
        await _unitOfWork.CommitAsync();

        return vehicle;
    }

    public async Task<Vehicle?> UpdateVehicleAsync(string id, UpdateVehicleDto dto)
    {
        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(id);
        if (vehicle == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.RegNumber))
        {
            var cleanReg = dto.RegNumber.Trim().ToUpper();
            if (await _unitOfWork.Vehicles.RegNumberExistsAsync(cleanReg, id))
            {
                throw new InvalidOperationException($"Vehicle registration number '{cleanReg}' is already registered to another vehicle.");
            }
            vehicle.RegNumber = cleanReg;
        }

        if (dto.Model != null) vehicle.Model = dto.Model.Trim();
        if (dto.Type != null) vehicle.Type = dto.Type;
        if (dto.FuelType != null) vehicle.FuelType = dto.FuelType;
        if (dto.DriverName != null) vehicle.DriverName = dto.DriverName.Trim();
        if (dto.DriverPhone != null) vehicle.DriverPhone = dto.DriverPhone.Trim();
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

        await _unitOfWork.Vehicles.UpdateAsync(vehicle);
        await _unitOfWork.CommitAsync();

        return vehicle;
    }

    public async Task<bool> DeleteVehicleAsync(string id)
    {
        var vehicle = await _unitOfWork.Vehicles.GetByIdAsync(id);
        if (vehicle == null) return false;

        var hasDutySlips = await _unitOfWork.DutySlips.ExistsAsync(d => d.VehicleId == id);
        if (hasDutySlips)
        {
            throw new InvalidOperationException($"Cannot delete vehicle '{vehicle.RegNumber}' because duty slips are attached to it. Please reassign or delete the duty slips first.");
        }

        await _unitOfWork.Vehicles.DeleteAsync(vehicle);
        await _unitOfWork.CommitAsync();
        return true;
    }
}

public class ClientService : IClientService
{
    private readonly IUnitOfWork _unitOfWork;

    public ClientService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IReadOnlyList<Client>> GetAllClientsAsync()
    {
        return await _unitOfWork.Clients.GetOrderedClientsAsync();
    }

    public async Task<Client?> GetClientByIdAsync(string id)
    {
        return await _unitOfWork.Clients.GetByIdAsync(id);
    }

    public async Task<Client> CreateClientAsync(CreateClientDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Gstin) && await _unitOfWork.Clients.GstinExistsAsync(dto.Gstin))
        {
            throw new InvalidOperationException($"Client with GSTIN '{dto.Gstin}' already exists.");
        }

        var client = new Client
        {
            Id = $"client-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..4]}",
            Name = dto.Name.Trim(),
            CompanyName = dto.CompanyName.Trim(),
            Gstin = dto.Gstin?.Trim() ?? "",
            Pan = dto.Pan?.Trim() ?? "",
            Address = dto.Address.Trim(),
            Phone = dto.Phone.Trim(),
            Email = dto.Email.Trim(),
            ContractRefNo = dto.ContractRefNo?.Trim() ?? "",
            ContractStartDate = dto.ContractStartDate,
            ContractEndDate = dto.ContractEndDate,
            PaymentTermsDays = dto.PaymentTermsDays > 0 ? dto.PaymentTermsDays : 30,
            Notes = dto.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Clients.AddAsync(client);
        await _unitOfWork.CommitAsync();

        return client;
    }

    public async Task<Client?> UpdateClientAsync(string id, UpdateClientDto dto)
    {
        var client = await _unitOfWork.Clients.GetByIdAsync(id);
        if (client == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.Gstin) && await _unitOfWork.Clients.GstinExistsAsync(dto.Gstin, id))
        {
            throw new InvalidOperationException($"GSTIN '{dto.Gstin}' is already registered to another client.");
        }

        if (dto.Name != null) client.Name = dto.Name.Trim();
        if (dto.CompanyName != null) client.CompanyName = dto.CompanyName.Trim();
        if (dto.Gstin != null) client.Gstin = dto.Gstin.Trim();
        if (dto.Pan != null) client.Pan = dto.Pan.Trim();
        if (dto.Address != null) client.Address = dto.Address.Trim();
        if (dto.Phone != null) client.Phone = dto.Phone.Trim();
        if (dto.Email != null) client.Email = dto.Email.Trim();
        if (dto.ContractRefNo != null) client.ContractRefNo = dto.ContractRefNo.Trim();
        if (dto.ContractStartDate != null) client.ContractStartDate = dto.ContractStartDate;
        if (dto.ContractEndDate != null) client.ContractEndDate = dto.ContractEndDate;
        if (dto.PaymentTermsDays.HasValue) client.PaymentTermsDays = dto.PaymentTermsDays.Value;
        if (dto.Notes != null) client.Notes = dto.Notes;
        client.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.Clients.UpdateAsync(client);
        await _unitOfWork.CommitAsync();

        return client;
    }

    public async Task<bool> DeleteClientAsync(string id)
    {
        var client = await _unitOfWork.Clients.GetByIdAsync(id);
        if (client == null) return false;

        var hasInvoices = await _unitOfWork.Invoices.ExistsAsync(i => i.ClientId == id);
        if (hasInvoices)
        {
            throw new InvalidOperationException($"Cannot delete client '{client.CompanyName}' because tax invoices exist for this client.");
        }

        var hasDutySlips = await _unitOfWork.DutySlips.ExistsAsync(d => d.ClientId == id);
        if (hasDutySlips)
        {
            throw new InvalidOperationException($"Cannot delete client '{client.CompanyName}' because duty slips exist for this client.");
        }

        await _unitOfWork.Clients.DeleteAsync(client);
        await _unitOfWork.CommitAsync();
        return true;
    }
}

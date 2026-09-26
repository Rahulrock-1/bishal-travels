using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Data;
using BishalTravels.Api.Models;

namespace BishalTravels.Api.Repositories;

// 1. Vehicle Repository
public interface IVehicleRepository : IRepository<Vehicle>
{
    Task<IReadOnlyList<Vehicle>> GetOrderedFleetAsync();
    Task<Vehicle?> GetByRegNumberAsync(string regNumber);
    Task<bool> RegNumberExistsAsync(string regNumber, string? excludeId = null);
}

public class VehicleRepository : Repository<Vehicle>, IVehicleRepository
{
    public VehicleRepository(BishalTravelsDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Vehicle>> GetOrderedFleetAsync()
    {
        return await _dbSet
            .OrderByDescending(v => v.Status == "Active")
            .ThenBy(v => v.RegNumber)
            .ToListAsync();
    }

    public async Task<Vehicle?> GetByRegNumberAsync(string regNumber)
    {
        var clean = regNumber.Trim().ToUpper();
        return await _dbSet.FirstOrDefaultAsync(v => v.RegNumber == clean);
    }

    public async Task<bool> RegNumberExistsAsync(string regNumber, string? excludeId = null)
    {
        var clean = regNumber.Trim().ToUpper();
        return await _dbSet.AnyAsync(v => v.RegNumber == clean && (excludeId == null || v.Id != excludeId));
    }
}

// 2. Client Repository
public interface IClientRepository : IRepository<Client>
{
    Task<IReadOnlyList<Client>> GetOrderedClientsAsync();
    Task<bool> GstinExistsAsync(string gstin, string? excludeId = null);
}

public class ClientRepository : Repository<Client>, IClientRepository
{
    public ClientRepository(BishalTravelsDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Client>> GetOrderedClientsAsync()
    {
        return await _dbSet
            .OrderBy(c => c.CompanyName)
            .ToListAsync();
    }

    public async Task<bool> GstinExistsAsync(string gstin, string? excludeId = null)
    {
        var clean = gstin.Trim().ToUpper();
        return await _dbSet.AnyAsync(c => c.Gstin == clean && (excludeId == null || c.Id != excludeId));
    }
}

// 3. Duty Slip Repository
public interface IDutySlipRepository : IRepository<DutySlip>
{
    Task<IReadOnlyList<DutySlip>> GetFilteredAsync(string? status, string? clientId, string? vehicleId);
    Task<IReadOnlyList<DutySlip>> GetUnbilledAsync(string? clientId, string? vehicleId);
    Task<DutySlip?> GetWithRelationsAsync(string id);
    Task<DutySlip?> GetByDutySlipNoAsync(string dutySlipNo);
    Task<bool> DutySlipNoExistsAsync(string dutySlipNo, string? excludeId = null);
}

public class DutySlipRepository : Repository<DutySlip>, IDutySlipRepository
{
    public DutySlipRepository(BishalTravelsDbContext context) : base(context) { }

    public async Task<IReadOnlyList<DutySlip>> GetFilteredAsync(string? status, string? clientId, string? vehicleId)
    {
        var query = _dbSet
            .Include(d => d.Vehicle)
            .Include(d => d.Client)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(d => d.Status == status);
        if (!string.IsNullOrWhiteSpace(clientId)) query = query.Where(d => d.ClientId == clientId);
        if (!string.IsNullOrWhiteSpace(vehicleId)) query = query.Where(d => d.VehicleId == vehicleId);

        return await query
            .OrderByDescending(d => d.Date)
            .ThenByDescending(d => d.DutySlipNo)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DutySlip>> GetUnbilledAsync(string? clientId, string? vehicleId)
    {
        var query = _dbSet
            .Include(d => d.Vehicle)
            .Include(d => d.Client)
            .Where(d => d.Status == "Pending" || string.IsNullOrEmpty(d.InvoiceId));

        if (!string.IsNullOrWhiteSpace(clientId)) query = query.Where(d => d.ClientId == clientId);
        if (!string.IsNullOrWhiteSpace(vehicleId)) query = query.Where(d => d.VehicleId == vehicleId);

        return await query
            .OrderBy(d => d.Date)
            .ToListAsync();
    }

    public async Task<DutySlip?> GetWithRelationsAsync(string id)
    {
        return await _dbSet
            .Include(d => d.Vehicle)
            .Include(d => d.Client)
            .Include(d => d.Invoice)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<DutySlip?> GetByDutySlipNoAsync(string dutySlipNo)
    {
        var clean = dutySlipNo.Trim().ToUpper();
        return await _dbSet.FirstOrDefaultAsync(d => d.DutySlipNo == clean);
    }

    public async Task<bool> DutySlipNoExistsAsync(string dutySlipNo, string? excludeId = null)
    {
        var clean = dutySlipNo.Trim().ToUpper();
        return await _dbSet.AnyAsync(d => d.DutySlipNo == clean && (excludeId == null || d.Id != excludeId));
    }
}

// 4. Invoice Repository
public interface IInvoiceRepository : IRepository<Invoice>
{
    Task<IReadOnlyList<Invoice>> GetFilteredAsync(string? status, string? month, string? clientId);
    Task<Invoice?> GetWithItemsAndClientAsync(string id);
    Task<Invoice?> GetByInvoiceNumberAsync(string invoiceNumber);
    Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, string? excludeId = null);
}

public class InvoiceRepository : Repository<Invoice>, IInvoiceRepository
{
    public InvoiceRepository(BishalTravelsDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Invoice>> GetFilteredAsync(string? status, string? month, string? clientId)
    {
        var query = _dbSet
            .Include(i => i.Items)
            .Include(i => i.Client)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(i => i.Status == status);
        if (!string.IsNullOrWhiteSpace(month)) query = query.Where(i => i.BillingMonth == month);
        if (!string.IsNullOrWhiteSpace(clientId)) query = query.Where(i => i.ClientId == clientId);

        return await query
            .OrderByDescending(i => i.InvoiceDate)
            .ThenByDescending(i => i.InvoiceNumber)
            .ToListAsync();
    }

    public async Task<Invoice?> GetWithItemsAndClientAsync(string id)
    {
        return await _dbSet
            .Include(i => i.Items)
            .Include(i => i.Client)
            .Include(i => i.AttachedDutySlips)
            .FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<Invoice?> GetByInvoiceNumberAsync(string invoiceNumber)
    {
        var clean = invoiceNumber.Trim().ToUpper();
        return await _dbSet.FirstOrDefaultAsync(i => i.InvoiceNumber == clean);
    }

    public async Task<bool> InvoiceNumberExistsAsync(string invoiceNumber, string? excludeId = null)
    {
        var clean = invoiceNumber.Trim().ToUpper();
        return await _dbSet.AnyAsync(i => i.InvoiceNumber == clean && (excludeId == null || i.Id != excludeId));
    }
}

// 5. Company Profile Repository
public interface ICompanyProfileRepository : IRepository<CompanyProfile>
{
    Task<CompanyProfile?> GetPrimaryProfileAsync();
}

public class CompanyProfileRepository : Repository<CompanyProfile>, ICompanyProfileRepository
{
    public CompanyProfileRepository(BishalTravelsDbContext context) : base(context) { }

    public async Task<CompanyProfile?> GetPrimaryProfileAsync()
    {
        return await _dbSet.FirstOrDefaultAsync();
    }
}

// 6. User Repository
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(BishalTravelsDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var clean = email.Trim().ToLower();
        return await _dbSet.FirstOrDefaultAsync(u => u.Email.ToLower() == clean);
    }
}

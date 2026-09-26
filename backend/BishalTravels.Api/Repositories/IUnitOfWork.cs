using BishalTravels.Api.Data;

namespace BishalTravels.Api.Repositories;

public interface IUnitOfWork : IDisposable
{
    IVehicleRepository Vehicles { get; }
    IClientRepository Clients { get; }
    IDutySlipRepository DutySlips { get; }
    IInvoiceRepository Invoices { get; }
    ICompanyProfileRepository CompanyProfiles { get; }
    IUserRepository Users { get; }
    Task<int> CommitAsync();
}

public class UnitOfWork : IUnitOfWork
{
    private readonly BishalTravelsDbContext _context;
    private IVehicleRepository? _vehicles;
    private IClientRepository? _clients;
    private IDutySlipRepository? _dutySlips;
    private IInvoiceRepository? _invoices;
    private ICompanyProfileRepository? _companyProfiles;
    private IUserRepository? _users;

    public UnitOfWork(BishalTravelsDbContext context)
    {
        _context = context;
    }

    public IVehicleRepository Vehicles => _vehicles ??= new VehicleRepository(_context);
    public IClientRepository Clients => _clients ??= new ClientRepository(_context);
    public IDutySlipRepository DutySlips => _dutySlips ??= new DutySlipRepository(_context);
    public IInvoiceRepository Invoices => _invoices ??= new InvoiceRepository(_context);
    public ICompanyProfileRepository CompanyProfiles => _companyProfiles ??= new CompanyProfileRepository(_context);
    public IUserRepository Users => _users ??= new UserRepository(_context);

    public async Task<int> CommitAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}

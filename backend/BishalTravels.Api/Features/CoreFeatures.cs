using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Models;
using BishalTravels.Api.Services.Interfaces;

namespace BishalTravels.Api.Features;

// ==========================================
// 1. COMPANY PROFILE FEATURES (CQRS)
// ==========================================
public record GetCompanyProfileQuery : IQuery<CompanyProfileDto>;
public record UpdateCompanyProfileCommand(CompanyProfileDto ProfileDto) : ICommand<CompanyProfileDto>;

public class CompanyQueryHandler : IRequestHandler<GetCompanyProfileQuery, CompanyProfileDto>
{
    private readonly ICompanyService _service;
    public CompanyQueryHandler(ICompanyService service) => _service = service;

    public async Task<CompanyProfileDto> HandleAsync(GetCompanyProfileQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetProfileAsync();
    }
}

public class CompanyCommandHandler : IRequestHandler<UpdateCompanyProfileCommand, CompanyProfileDto>
{
    private readonly ICompanyService _service;
    public CompanyCommandHandler(ICompanyService service) => _service = service;

    public async Task<CompanyProfileDto> HandleAsync(UpdateCompanyProfileCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpdateProfileAsync(request.ProfileDto);
    }
}

// ==========================================
// 2. VEHICLE FLEET FEATURES (CQRS)
// ==========================================
public record GetFleetQuery : IQuery<IReadOnlyList<Vehicle>>;
public record GetVehicleByIdQuery(string Id) : IQuery<Vehicle?>;
public record CreateVehicleCommand(CreateVehicleDto Dto) : ICommand<Vehicle>;
public record UpdateVehicleCommand(string Id, UpdateVehicleDto Dto) : ICommand<Vehicle?>;
public record DeleteVehicleCommand(string Id) : ICommand<bool>;

public class VehicleQueryHandlers : 
    IRequestHandler<GetFleetQuery, IReadOnlyList<Vehicle>>,
    IRequestHandler<GetVehicleByIdQuery, Vehicle?>
{
    private readonly IVehicleService _service;
    public VehicleQueryHandlers(IVehicleService service) => _service = service;

    public async Task<IReadOnlyList<Vehicle>> HandleAsync(GetFleetQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetAllVehiclesAsync();
    }

    public async Task<Vehicle?> HandleAsync(GetVehicleByIdQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetVehicleByIdAsync(request.Id);
    }
}

public class VehicleCommandHandlers :
    IRequestHandler<CreateVehicleCommand, Vehicle>,
    IRequestHandler<UpdateVehicleCommand, Vehicle?>,
    IRequestHandler<DeleteVehicleCommand, bool>
{
    private readonly IVehicleService _service;
    public VehicleCommandHandlers(IVehicleService service) => _service = service;

    public async Task<Vehicle> HandleAsync(CreateVehicleCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.CreateVehicleAsync(request.Dto);
    }

    public async Task<Vehicle?> HandleAsync(UpdateVehicleCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpdateVehicleAsync(request.Id, request.Dto);
    }

    public async Task<bool> HandleAsync(DeleteVehicleCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.DeleteVehicleAsync(request.Id);
    }
}

// ==========================================
// 3. CLIENT FEATURES (CQRS)
// ==========================================
public record GetClientsQuery : IQuery<IReadOnlyList<Client>>;
public record GetClientByIdQuery(string Id) : IQuery<Client?>;
public record CreateClientCommand(CreateClientDto Dto) : ICommand<Client>;
public record UpdateClientCommand(string Id, UpdateClientDto Dto) : ICommand<Client?>;
public record DeleteClientCommand(string Id) : ICommand<bool>;

public class ClientQueryHandlers :
    IRequestHandler<GetClientsQuery, IReadOnlyList<Client>>,
    IRequestHandler<GetClientByIdQuery, Client?>
{
    private readonly IClientService _service;
    public ClientQueryHandlers(IClientService service) => _service = service;

    public async Task<IReadOnlyList<Client>> HandleAsync(GetClientsQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetAllClientsAsync();
    }

    public async Task<Client?> HandleAsync(GetClientByIdQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetClientByIdAsync(request.Id);
    }
}

public class ClientCommandHandlers :
    IRequestHandler<CreateClientCommand, Client>,
    IRequestHandler<UpdateClientCommand, Client?>,
    IRequestHandler<DeleteClientCommand, bool>
{
    private readonly IClientService _service;
    public ClientCommandHandlers(IClientService service) => _service = service;

    public async Task<Client> HandleAsync(CreateClientCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.CreateClientAsync(request.Dto);
    }

    public async Task<Client?> HandleAsync(UpdateClientCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpdateClientAsync(request.Id, request.Dto);
    }

    public async Task<bool> HandleAsync(DeleteClientCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.DeleteClientAsync(request.Id);
    }
}

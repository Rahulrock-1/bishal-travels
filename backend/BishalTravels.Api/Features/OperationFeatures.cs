using BishalTravels.Api.Common;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Models;
using BishalTravels.Api.Services.Interfaces;

namespace BishalTravels.Api.Features;

// ==========================================
// 1. DUTY SLIP FEATURES (CQRS)
// ==========================================
public record GetDutySlipsQuery(string? Status, string? ClientId, string? VehicleId) : IQuery<IReadOnlyList<DutySlip>>;
public record GetUnbilledDutySlipsQuery(string? ClientId, string? VehicleId) : IQuery<IReadOnlyList<DutySlip>>;
public record GetDutySlipByIdQuery(string Id) : IQuery<DutySlip?>;
public record CreateDutySlipCommand(CreateDutySlipDto Dto) : ICommand<DutySlip>;
public record UpdateDutySlipCommand(string Id, UpdateDutySlipDto Dto) : ICommand<DutySlip?>;
public record UpsertDutySlipCommand(UpsertDutySlipDto Dto) : ICommand<DutySlip>;
public record BatchUpsertDutySlipsCommand(IEnumerable<UpsertDutySlipDto> Dtos) : ICommand<IReadOnlyList<DutySlip>>;
public record DeleteDutySlipCommand(string Id) : ICommand<bool>;

public class DutySlipQueryHandlers :
    IRequestHandler<GetDutySlipsQuery, IReadOnlyList<DutySlip>>,
    IRequestHandler<GetUnbilledDutySlipsQuery, IReadOnlyList<DutySlip>>,
    IRequestHandler<GetDutySlipByIdQuery, DutySlip?>
{
    private readonly IDutySlipService _service;
    public DutySlipQueryHandlers(IDutySlipService service) => _service = service;

    public async Task<IReadOnlyList<DutySlip>> HandleAsync(GetDutySlipsQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetDutySlipsAsync(request.Status, request.ClientId, request.VehicleId);
    }

    public async Task<IReadOnlyList<DutySlip>> HandleAsync(GetUnbilledDutySlipsQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetUnbilledDutySlipsAsync(request.ClientId, request.VehicleId);
    }

    public async Task<DutySlip?> HandleAsync(GetDutySlipByIdQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetDutySlipByIdAsync(request.Id);
    }
}

public class DutySlipCommandHandlers :
    IRequestHandler<CreateDutySlipCommand, DutySlip>,
    IRequestHandler<UpdateDutySlipCommand, DutySlip?>,
    IRequestHandler<UpsertDutySlipCommand, DutySlip>,
    IRequestHandler<BatchUpsertDutySlipsCommand, IReadOnlyList<DutySlip>>,
    IRequestHandler<DeleteDutySlipCommand, bool>
{
    private readonly IDutySlipService _service;
    public DutySlipCommandHandlers(IDutySlipService service) => _service = service;

    public async Task<DutySlip> HandleAsync(CreateDutySlipCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.CreateDutySlipAsync(request.Dto);
    }

    public async Task<DutySlip?> HandleAsync(UpdateDutySlipCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpdateDutySlipAsync(request.Id, request.Dto);
    }

    public async Task<DutySlip> HandleAsync(UpsertDutySlipCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpsertDutySlipAsync(request.Dto);
    }

    public async Task<IReadOnlyList<DutySlip>> HandleAsync(BatchUpsertDutySlipsCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.BatchUpsertDutySlipsAsync(request.Dtos);
    }

    public async Task<bool> HandleAsync(DeleteDutySlipCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.DeleteDutySlipAsync(request.Id);
    }
}

// ==========================================
// 2. INVOICE FEATURES (CQRS)
// ==========================================
public record GetInvoicesQuery(string? Status, string? Month, string? ClientId) : IQuery<IReadOnlyList<InvoiceResponseDto>>;
public record GetInvoiceByIdQuery(string Id) : IQuery<InvoiceResponseDto?>;
public record CreateInvoiceCommand(CreateInvoiceRequestDto Dto) : ICommand<InvoiceResponseDto>;
public record UpdateInvoiceCommand(string Id, UpdateInvoiceRequestDto Dto) : ICommand<InvoiceResponseDto?>;
public record UpdateInvoiceStatusCommand(string Id, string Status) : ICommand<bool>;
public record DeleteInvoiceCommand(string Id) : ICommand<bool>;

public class InvoiceQueryHandlers :
    IRequestHandler<GetInvoicesQuery, IReadOnlyList<InvoiceResponseDto>>,
    IRequestHandler<GetInvoiceByIdQuery, InvoiceResponseDto?>
{
    private readonly IInvoiceService _service;
    public InvoiceQueryHandlers(IInvoiceService service) => _service = service;

    public async Task<IReadOnlyList<InvoiceResponseDto>> HandleAsync(GetInvoicesQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetInvoicesAsync(request.Status, request.Month, request.ClientId);
    }

    public async Task<InvoiceResponseDto?> HandleAsync(GetInvoiceByIdQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetInvoiceByIdAsync(request.Id);
    }
}

public class InvoiceCommandHandlers :
    IRequestHandler<CreateInvoiceCommand, InvoiceResponseDto>,
    IRequestHandler<UpdateInvoiceCommand, InvoiceResponseDto?>,
    IRequestHandler<UpdateInvoiceStatusCommand, bool>,
    IRequestHandler<DeleteInvoiceCommand, bool>
{
    private readonly IInvoiceService _service;
    public InvoiceCommandHandlers(IInvoiceService service) => _service = service;

    public async Task<InvoiceResponseDto> HandleAsync(CreateInvoiceCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.CreateInvoiceAsync(request.Dto);
    }

    public async Task<InvoiceResponseDto?> HandleAsync(UpdateInvoiceCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpdateInvoiceAsync(request.Id, request.Dto);
    }

    public async Task<bool> HandleAsync(UpdateInvoiceStatusCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.UpdateInvoiceStatusAsync(request.Id, request.Status);
    }

    public async Task<bool> HandleAsync(DeleteInvoiceCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.DeleteInvoiceAsync(request.Id);
    }
}

// ==========================================
// 3. REPORT FEATURES (CQRS)
// ==========================================
public record GetMonthlyReportQuery(string? Month) : IQuery<object>;

public class ReportQueryHandler : IRequestHandler<GetMonthlyReportQuery, object>
{
    private readonly IReportService _service;
    public ReportQueryHandler(IReportService service) => _service = service;

    public async Task<object> HandleAsync(GetMonthlyReportQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetMonthlyReportAsync(request.Month);
    }
}

// ==========================================
// 4. BACKUP FEATURES (CQRS)
// ==========================================
public record ExportBackupQuery : IQuery<AppStateDataDto>;
public record RestoreBackupCommand(AppStateDataDto Dto) : ICommand<bool>;
public record ResetToSampleDataCommand : ICommand<bool>;

public class BackupQueryHandler : IRequestHandler<ExportBackupQuery, AppStateDataDto>
{
    private readonly IBackupService _service;
    public BackupQueryHandler(IBackupService service) => _service = service;

    public async Task<AppStateDataDto> HandleAsync(ExportBackupQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.ExportBackupAsync();
    }
}

public class BackupCommandHandlers :
    IRequestHandler<RestoreBackupCommand, bool>,
    IRequestHandler<ResetToSampleDataCommand, bool>
{
    private readonly IBackupService _service;
    public BackupCommandHandlers(IBackupService service) => _service = service;

    public async Task<bool> HandleAsync(RestoreBackupCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.RestoreBackupAsync(request.Dto);
    }

    public async Task<bool> HandleAsync(ResetToSampleDataCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.ResetToSampleDataAsync();
    }
}

// ==========================================
// 5. AUTH FEATURES (CQRS)
// ==========================================
public record LoginCommand(LoginRequest Request) : ICommand<LoginResponse>;
public record GetCurrentUserQuery : IQuery<AuthUserDto>;

public class AuthCommandHandlers :
    IRequestHandler<LoginCommand, LoginResponse>,
    IRequestHandler<GetCurrentUserQuery, AuthUserDto>
{
    private readonly IAuthService _service;
    public AuthCommandHandlers(IAuthService service) => _service = service;

    public async Task<LoginResponse> HandleAsync(LoginCommand request, CancellationToken cancellationToken = default)
    {
        return await _service.LoginAsync(request.Request);
    }

    public async Task<AuthUserDto> HandleAsync(GetCurrentUserQuery request, CancellationToken cancellationToken = default)
    {
        return await _service.GetCurrentUserAsync();
    }
}

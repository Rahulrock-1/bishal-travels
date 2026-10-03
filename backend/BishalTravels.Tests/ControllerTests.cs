using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using BishalTravels.Api.Common;
using BishalTravels.Api.Controllers;
using BishalTravels.Api.Data;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Messaging;
using BishalTravels.Api.Models;
using BishalTravels.Api.Repositories;
using BishalTravels.Api.Security;
using BishalTravels.Api.Services;
using BishalTravels.Api.Services.Implementations;
using BishalTravels.Api.Services.Interfaces;

namespace BishalTravels.Tests;

public class ControllerTests
{
    private (BishalTravelsDbContext context, IMediator mediator) CreateTestDependencies(string dbName)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IMessageBus, RabbitMqMessageBus>();

        services.AddDbContext<BishalTravelsDbContext>(options =>
            options.UseInMemoryDatabase(databaseName: dbName));

        // Repositories & Unit of Work
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IVehicleRepository, VehicleRepository>();
        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<IDutySlipRepository, DutySlipRepository>();
        services.AddScoped<IInvoiceRepository, InvoiceRepository>();
        services.AddScoped<ICompanyProfileRepository, CompanyProfileRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Domain & Application Services
        services.AddScoped<ICalculationService, CalculationService>();
        services.AddScoped<ICompanyService, CompanyService>();
        services.AddScoped<IVehicleService, VehicleService>();
        services.AddScoped<IClientService, ClientService>();
        services.AddScoped<IDutySlipService, DutySlipService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IBackupService, BackupService>();
        services.AddScoped<IAuthService, AuthService>();

        // CQRS Mediator & Request Handlers
        services.AddCqrs(typeof(BishalTravelsDbContext).Assembly);

        var provider = services.BuildServiceProvider();
        var context = provider.GetRequiredService<BishalTravelsDbContext>();
        var mediator = provider.GetRequiredService<IMediator>();

        return (context, mediator);
    }

    [Fact]
    public async Task CompanyController_ReturnsAndUpdatesCompanyProfile()
    {
        var (context, mediator) = CreateTestDependencies(nameof(CompanyController_ReturnsAndUpdatesCompanyProfile));
        await DbInitializer.InitializeAsync(context);

        var controller = new CompanyController(mediator);

        // 1. Get profile
        var getResult = await controller.GetCompanyProfile();
        var okResult = Assert.IsType<OkObjectResult>(getResult.Result);
        var profile = Assert.IsType<CompanyProfileDto>(okResult.Value);

        Assert.Equal("BISHAL TRAVELS", profile.BusinessName);
        Assert.Equal("SBIN0002117", profile.IfscCode);

        // 2. Update profile
        var updateDto = profile with { Phone = "9830000000", Tagline = "Updated Tagline" };
        var updateResult = await controller.UpdateCompanyProfile(updateDto);
        var updatedOk = Assert.IsType<OkObjectResult>(updateResult.Result);
        var updatedProfile = Assert.IsType<CompanyProfileDto>(updatedOk.Value);

        Assert.Equal("9830000000", updatedProfile.Phone);
        Assert.Equal("Updated Tagline", updatedProfile.Tagline);
    }

    [Fact]
    public async Task VehiclesController_PerformsFullCrudOperations()
    {
        var (context, mediator) = CreateTestDependencies(nameof(VehiclesController_PerformsFullCrudOperations));
        var controller = new VehiclesController(mediator);

        // 1. Create Vehicle
        var createDto = new CreateVehicleDto(
            RegNumber: "WB 02 AL 9999",
            Model: "Hyundai Aura",
            Type: "Sedan",
            FuelType: "CNG",
            DriverName: "Kalyan Ghosh",
            DriverPhone: "9832100000",
            DefaultDailyKm: 100,
            DefaultDailyHours: 10,
            BaseMonthlyRate: 38000,
            RatePerKm: 16,
            RatePerHour: 80,
            GarageRatePerKm: 0,
            NightChargeRate: 350,
            Status: "Active",
            Notes: "New commercial sedan"
        );

        var createResult = await controller.CreateVehicle(createDto);
        var createdAction = Assert.IsType<CreatedAtActionResult>(createResult.Result);
        var vehicle = Assert.IsType<Vehicle>(createdAction.Value);

        Assert.Equal("WB 02 AL 9999", vehicle.RegNumber);
        Assert.StartsWith("veh-", vehicle.Id);

        // 2. Read Vehicles
        var listResult = await controller.GetVehicles();
        var okList = Assert.IsType<OkObjectResult>(listResult.Result);
        var vehicles = Assert.IsAssignableFrom<IEnumerable<Vehicle>>(okList.Value);
        Assert.Single(vehicles);

        // 3. Update Vehicle
        var updateDto = new UpdateVehicleDto(
            RegNumber: null,
            Model: null,
            Type: null,
            FuelType: null,
            DriverName: "Kalyan Ghosh Updated",
            DriverPhone: null,
            DefaultDailyKm: null,
            DefaultDailyHours: null,
            BaseMonthlyRate: 39000,
            RatePerKm: null,
            RatePerHour: null,
            GarageRatePerKm: null,
            NightChargeRate: null,
            Status: null,
            Notes: null
        );

        var updateResult = await controller.UpdateVehicle(vehicle.Id, updateDto);
        var updatedOk = Assert.IsType<OkObjectResult>(updateResult.Result);
        var updatedVehicle = Assert.IsType<Vehicle>(updatedOk.Value);

        Assert.Equal("Kalyan Ghosh Updated", updatedVehicle.DriverName);
        Assert.Equal(39000m, updatedVehicle.BaseMonthlyRate);

        // 4. Delete Vehicle
        var deleteResult = await controller.DeleteVehicle(vehicle.Id);
        Assert.IsType<NoContentResult>(deleteResult);

        var getAfterDelete = await controller.GetVehicle(vehicle.Id);
        Assert.IsType<NotFoundObjectResult>(getAfterDelete.Result);
    }

    [Fact]
    public async Task InvoicesController_CreatesInvoiceAndMarksDutySlipsBilled()
    {
        var (context, mediator) = CreateTestDependencies(nameof(InvoicesController_CreatesInvoiceAndMarksDutySlipsBilled));
        var slipsController = new DutySlipsController(mediator);
        var invoicesController = new InvoicesController(mediator);

        // Seed client and vehicle
        var client = new Client
        {
            Id = "client-test",
            CompanyName = "Test Infra Corp",
            Name = "Manager",
            Gstin = "19AAACW1234F1Z1",
            Address = "Salt Lake, Kolkata",
            Phone = "9000000000",
            Email = "test@infra.com",
            ContractRefNo = "CNT-2026-001"
        };
        var vehicle = new Vehicle
        {
            Id = "veh-test",
            RegNumber = "WB 19 A 1234",
            Model = "Dzire",
            DriverName = "Driver 1",
            DriverPhone = "9111111111",
            BaseMonthlyRate = 40000,
            RatePerKm = 18,
            RatePerHour = 90,
            NightChargeRate = 350
        };
        context.Clients.Add(client);
        context.Vehicles.Add(vehicle);
        await context.SaveChangesAsync();

        // Create a duty slip
        var slipDto = new CreateDutySlipDto(
            DutySlipNo: "DS-TEST-001",
            Date: "2026-08-10",
            VehicleId: vehicle.Id,
            ClientId: client.Id,
            Route: "Kolkata to Haldia",
            DriverName: "Driver 1",
            StartKm: 1000,
            EndKm: 1200,
            GarageOutKm: null,
            GarageInKm: null,
            GarageKm: null,
            StartTime: "08:00",
            EndTime: "18:00",
            ExtraDuty: null,
            ExtraDutyCharges: null,
            NightCharges: 0,
            ParkingCharges: 100,
            TollCharges: 250,
            DriverBatta: 200,
            FuelCharges: 0,
            OtherExpenses: 0,
            Notes: "Client visit"
        );

        var slipResult = await slipsController.CreateDutySlip(slipDto);
        var slipAction = Assert.IsType<CreatedAtActionResult>(slipResult.Result);
        var createdSlip = Assert.IsType<DutySlip>(slipAction.Value);

        Assert.Equal("Pending", createdSlip.Status);
        Assert.Equal(200m, createdSlip.TotalKm);

        // Create Invoice attaching the duty slip
        var invDto = new CreateInvoiceRequestDto(
            InvoiceNumber: "BT/26-27/009",
            InvoiceDate: "2026-08-31",
            DueDate: "2026-09-15",
            BillingMonth: "August 2026",
            ClientId: client.Id,
            ContractRefNo: "CNT-2026-001",
            Items: new List<InvoiceItemDto>
            {
                new InvoiceItemDto(
                    Id: "item-1",
                    Description: "Duty Run Kolkata to Haldia (DS-TEST-001)",
                    VehicleRegNo: vehicle.RegNumber,
                    VehicleModel: vehicle.Model,
                    BillingType: "DutySlipAggregated",
                    BasePackageAmount: 0,
                    TotalRunKm: 200,
                    RatePerKm: 18,
                    KmCharges: 3600,
                    ExtraKm: 0,
                    ExtraKmRate: 0,
                    ExtraKmCharges: 0,
                    ExtraHours: 0,
                    ExtraHourRate: 0,
                    ExtraHourCharges: 0,
                    NightCharges: 0,
                    ParkingCharges: 100,
                    TollCharges: 250,
                    DriverAllowance: 200,
                    OtherCharges: 0,
                    Amount: 4150
                )
            },
            AttachedDutySlipIds: new List<string> { createdSlip.Id },
            Subtotal: 4150,
            TaxType: "GST_5",
            TaxRate: 5,
            IsInterstate: false,
            Discount: 0,
            AdvanceReceived: 0,
            TdsRate: 0,
            TdsAmount: 0,
            Notes: "Monthly invoice",
            Terms: new List<string> { "Payment within 15 days" }
        );

        var invResult = await invoicesController.CreateInvoice(invDto);
        var invCreated = Assert.IsType<CreatedAtActionResult>(invResult.Result);
        var createdInvoice = Assert.IsType<InvoiceResponseDto>(invCreated.Value);

        Assert.Equal("BT/26-27/009", createdInvoice.InvoiceNumber);

        // Verify that the duty slip was automatically marked as 'Billed'
        var reloadedSlip = await context.DutySlips.FindAsync(createdSlip.Id);
        Assert.NotNull(reloadedSlip);
        Assert.Equal("Billed", reloadedSlip.Status);
        Assert.Equal(createdInvoice.Id, reloadedSlip.InvoiceId);
    }

    [Fact]
    public async Task AuthController_GeneratesValidJwtToken_OnLogin()
    {
        var (context, mediator) = CreateTestDependencies(nameof(AuthController_GeneratesValidJwtToken_OnLogin));
        await DbInitializer.InitializeAsync(context);

        var authController = new AuthController(mediator);
        var loginRequest = new LoginRequest("biswajitpramanikrock@gmail.com", "Biswajit@1989");

        var loginResult = await authController.Login(loginRequest);
        var okResult = Assert.IsType<OkObjectResult>(loginResult.Result);
        var response = Assert.IsType<LoginResponse>(okResult.Value);

        Assert.True(response.Success);
        Assert.NotNull(response.Token);
        Assert.NotNull(response.User);
        Assert.Equal("Biswajit Pramanik", response.User.Name);

        // Verify JWT format: header.payload.signature
        var tokenParts = response.Token.Split('.');
        Assert.Equal(3, tokenParts.Length);
    }

    [Fact]
    public void JwtTokenGenerator_ProducesValidSignedToken()
    {
        var config = new ConfigurationBuilder().Build();
        var generator = new JwtTokenGenerator(config);

        var token = generator.GenerateToken(10, "admin@bishal.com", "Admin User", "Administrator");

        Assert.NotNull(token);
        var parts = token.Split('.');
        Assert.Equal(3, parts.Length);
    }

    [Fact]
    public async Task DutySlipsController_Upsert_CreatesAndThenUpdatesRealtime()
    {
        var (context, mediator) = CreateTestDependencies(nameof(DutySlipsController_Upsert_CreatesAndThenUpdatesRealtime));
        await DbInitializer.InitializeAsync(context);

        var controller = new DutySlipsController(mediator);
        var upsertDto = new UpsertDutySlipDto(
            Id: null,
            DutySlipNo: "DS-TEST-REALTIME-01",
            Date: "2026-10-03",
            VehicleId: "veh-001",
            ClientId: "cli-001",
            Route: "Kolkata to Airport",
            DriverName: "Bishal Driver",
            StartKm: 10000,
            EndKm: 10150,
            GarageOutKm: 10,
            GarageInKm: 10,
            GarageKm: 20,
            StartTime: "08:00",
            EndTime: "18:00",
            ExtraDuty: "Regular Duty",
            ExtraDutyCharges: 0,
            NightCharges: 0,
            ParkingCharges: 100,
            TollCharges: 250,
            DriverBatta: 300,
            FuelCharges: 0,
            OtherExpenses: 0,
            Notes: "Realtime test log",
            Status: "Pending"
        );

        // 1. Initial creation via upsert
        var createResult = await controller.UpsertDutySlip(upsertDto);
        var okCreate = Assert.IsType<OkObjectResult>(createResult.Result);
        var createdSlip = Assert.IsType<DutySlip>(okCreate.Value);

        Assert.Equal("DS-TEST-REALTIME-01", createdSlip.DutySlipNo);
        Assert.Equal(150m, createdSlip.TotalKm);
        Assert.Equal(100m, createdSlip.ParkingCharges);

        // 2. Realtime update via upsert with same vehicle and date
        var updateDto = upsertDto with {
            Id = createdSlip.Id,
            EndKm = 10200,
            ParkingCharges = 200,
            Notes = "Updated realtime in database"
        };

        var updateResult = await controller.UpsertDutySlip(updateDto);
        var okUpdate = Assert.IsType<OkObjectResult>(updateResult.Result);
        var updatedSlip = Assert.IsType<DutySlip>(okUpdate.Value);

        Assert.Equal(createdSlip.Id, updatedSlip.Id);
        Assert.Equal(200m, updatedSlip.TotalKm);
        Assert.Equal(200m, updatedSlip.ParkingCharges);
        Assert.Equal("Updated realtime in database", updatedSlip.Notes);
    }
}

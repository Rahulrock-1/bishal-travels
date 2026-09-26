using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;
using BishalTravels.Api.Controllers;
using BishalTravels.Api.Data;
using BishalTravels.Api.DTOs;
using BishalTravels.Api.Models;
using BishalTravels.Api.Services;

namespace BishalTravels.Tests;

public class ControllerTests
{
    private BishalTravelsDbContext CreateInMemoryDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<BishalTravelsDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;

        var context = new BishalTravelsDbContext(options);
        return context;
    }

    [Fact]
    public async Task CompanyController_ReturnsAndUpdatesCompanyProfile()
    {
        using var context = CreateInMemoryDbContext(nameof(CompanyController_ReturnsAndUpdatesCompanyProfile));
        await DbInitializer.InitializeAsync(context);

        var controller = new CompanyController(context);

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
        using var context = CreateInMemoryDbContext(nameof(VehiclesController_PerformsFullCrudOperations));
        var controller = new VehiclesController(context);

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
        using var context = CreateInMemoryDbContext(nameof(InvoicesController_CreatesInvoiceAndMarksDutySlipsBilled));
        var calcService = new CalculationService();
        var slipsController = new DutySlipsController(context, calcService);
        var invoicesController = new InvoicesController(context);

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
        var invDto = new CreateInvoiceDto(
            InvoiceNumber: "BT/26-27/009",
            InvoiceDate: "2026-08-31",
            DueDate: "2026-09-15",
            BillingMonth: "August 2026",
            ClientId: client.Id,
            ClientSnapshot: client,
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
            Cgst: 103.75m,
            Sgst: 103.75m,
            Igst: 0,
            IsInterstate: false,
            Discount: 0,
            AdvanceReceived: 0,
            TdsRate: 0,
            TdsAmount: 0,
            GrandTotal: 4357.50m,
            NetPayable: 4357.50m,
            AmountInWords: "Rupees Four Thousand Three Hundred Fifty-Seven and Fifty Paise Only",
            BankDetails: new BankDetailsDto("SBI", "Bishal Travels", "44982066411", "SBIN0002117", "Bishnupur", "9088933712@sbi"),
            TradeLicenseNo: "1711",
            CompanyGstin: "",
            CompanyPan: "BQNPP4333F",
            CompanyPhone: "9088933712",
            CompanyEmail: "bishaltravels.kolkata@gmail.com",
            CompanyAddress: "Hooghly, West Bengal",
            Status: "Draft",
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
}

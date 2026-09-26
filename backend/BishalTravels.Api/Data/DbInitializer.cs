using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using BishalTravels.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BishalTravels.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(BishalTravelsDbContext context)
    {
        // Ensure database schema exists
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Company Profile
        if (!await context.CompanyProfiles.AnyAsync())
        {
            var profile = new CompanyProfile
            {
                Id = 1,
                BusinessName = "BISHAL TRAVELS",
                Tagline = "Car Rental & Commercial Fleet Operations",
                TradeLicenseNo = "1711",
                VendorId = "10482",
                Gstin = "",
                Pan = "BQNPP4333F",
                Address = "VILL - KALMIKHALI, P.O - ANDHARMANIK, P.S - BISHNUPUR, DIST - SOUTH 24 PARGANAS, PIN - 743503, STATE - WEST BENGAL",
                Phone = "9088933712",
                Email = "bishaltravels.kolkata@gmail.com",
                BankName = "STATE BANK OF INDIA",
                AccountHolder = "BISHAL TRAVELS",
                AccountNumber = "44982066411",
                IfscCode = "SBIN0002117",
                BranchName = "Bishnupur Branch, South 24 Parganas",
                UpiId = "9088933712@sbi",
                SignatoryName = "Biswajit Pramanik",
                SignatoryTitle = "Proprietor / Authorized Signatory",
                DefaultTerms = new string[]
                {
                    "Payment must be cleared within 15 days from the date of invoice submission.",
                    "Parking and toll charges are billed as per actuals.",
                    "Night charges applicable for duties beyond normal operating hours."
                },
                IsConfigured = true,
                UpdatedAt = DateTime.UtcNow
            };
            context.CompanyProfiles.Add(profile);
            await context.SaveChangesAsync();
        }

        // 2. Seed Master Admin User
        if (!await context.Users.AnyAsync())
        {
            context.Users.Add(new User
            {
                Email = "biswajitpramanikrock@gmail.com",
                Name = "Biswajit Pramanik",
                PasswordHash = HashPassword("Biswajit@1989"),
                Role = "Administrator / Owner",
                CreatedAt = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }

        // 3. Seed Vehicles
        if (!await context.Vehicles.AnyAsync())
        {
            context.Vehicles.AddRange(
                new Vehicle
                {
                    Id = "veh-1",
                    RegNumber = "WB19R4841",
                    Model = "Maruti Suzuki Swift Dzire (Commercial)",
                    Type = "Sedan",
                    FuelType = "Diesel",
                    DriverName = "Ramesh Das",
                    DriverPhone = "9088933712",
                    DefaultDailyKm = 100,
                    DefaultDailyHours = 10,
                    BaseMonthlyRate = 40000,
                    RatePerKm = 18,
                    RatePerHour = 90,
                    NightChargeRate = 350,
                    Status = "Active",
                    Notes = "Primary monthly corporate vehicle",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Vehicle
                {
                    Id = "veh-2",
                    RegNumber = "WB02AL4589",
                    Model = "Toyota Innova Crysta",
                    Type = "Innova Crysta",
                    FuelType = "Diesel",
                    DriverName = "Subhasish Roy",
                    DriverPhone = "9832044556",
                    DefaultDailyKm = 120,
                    DefaultDailyHours = 12,
                    BaseMonthlyRate = 65000,
                    RatePerKm = 24,
                    RatePerHour = 150,
                    NightChargeRate = 500,
                    Status = "Active",
                    Notes = "Outstation and VIP Duties",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new Vehicle
                {
                    Id = "veh-3",
                    RegNumber = "WB06H8821",
                    Model = "Maruti Suzuki Ertiga",
                    Type = "SUV",
                    FuelType = "CNG",
                    DriverName = "Anup Mondal",
                    DriverPhone = "9748033211",
                    DefaultDailyKm = 100,
                    DefaultDailyHours = 10,
                    BaseMonthlyRate = 45000,
                    RatePerKm = 16,
                    RatePerHour = 120,
                    NightChargeRate = 400,
                    Status = "Active",
                    Notes = "Monthly corporate duty",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
            await context.SaveChangesAsync();
        }

        // 4. Seed Clients
        if (!await context.Clients.AnyAsync())
        {
            context.Clients.AddRange(
                new Client
                {
                    Id = "client-1",
                    Name = "Logistics Manager",
                    CompanyName = "Eastern Infrastructure Projects Ltd.",
                    Gstin = "",
                    Pan = "",
                    Address = "Sector V, Salt Lake, Kolkata - 700091",
                    Phone = "9830012345",
                    Email = "billing@easterninfra.in",
                    ContractRefNo = "EIPL/TRAN/2026/044",
                    ContractStartDate = "2026-07-01",
                    PaymentTermsDays = 15,
                    Notes = "Monthly dedicated vehicle contract",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
            await context.SaveChangesAsync();
        }
    }

    public static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    public static bool VerifyPassword(string password, string storedHash)
    {
        var hash = HashPassword(password);
        return hash == storedHash;
    }
}

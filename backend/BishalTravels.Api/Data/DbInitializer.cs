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
        if (context.Database.IsRelational())
        {
            const string schemaDdl = @"
                CREATE TABLE IF NOT EXISTS company_profiles (
                    id SERIAL PRIMARY KEY,
                    business_name VARCHAR(200) NOT NULL DEFAULT 'BISHAL TRAVELS',
                    tagline VARCHAR(250) DEFAULT 'Car Rental & Commercial Fleet Operations',
                    trade_license_no VARCHAR(100) NOT NULL DEFAULT '1711',
                    vendor_id VARCHAR(100) DEFAULT '10482',
                    gstin VARCHAR(20) DEFAULT '',
                    pan VARCHAR(20) NOT NULL DEFAULT 'BQNPP4333F',
                    address VARCHAR(500) NOT NULL DEFAULT '',
                    phone VARCHAR(50) NOT NULL DEFAULT '9088933712',
                    email VARCHAR(100) NOT NULL DEFAULT 'bishaltravels.kolkata@gmail.com',
                    bank_name VARCHAR(150) NOT NULL DEFAULT 'STATE BANK OF INDIA',
                    account_holder VARCHAR(150) NOT NULL DEFAULT 'BISHAL TRAVELS',
                    account_number VARCHAR(50) NOT NULL DEFAULT '44982066411',
                    ifsc_code VARCHAR(20) NOT NULL DEFAULT 'SBIN0002117',
                    branch_name VARCHAR(150) NOT NULL DEFAULT 'Bishnupur Branch, South 24 Parganas',
                    upi_id VARCHAR(100) DEFAULT '9088933712@sbi',
                    signatory_name VARCHAR(150) DEFAULT 'Biswajit Pramanik',
                    signatory_title VARCHAR(100) DEFAULT 'Proprietor / Authorized Signatory',
                    logo_url VARCHAR(500),
                    default_terms TEXT[] DEFAULT ARRAY[
                        'Payment must be cleared within 15 days from the date of invoice submission.',
                        'Parking and toll charges are billed as per actuals.',
                        'Night charges applicable for duties beyond normal operating hours.'
                    ],
                    is_configured BOOLEAN NOT NULL DEFAULT TRUE,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    name VARCHAR(150) NOT NULL,
                    password_hash TEXT NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'Administrator',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS vehicles (
                    id VARCHAR(50) PRIMARY KEY,
                    reg_number VARCHAR(30) UNIQUE NOT NULL,
                    model VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL DEFAULT 'Sedan',
                    fuel_type VARCHAR(30) NOT NULL DEFAULT 'Diesel',
                    driver_name VARCHAR(100) NOT NULL,
                    driver_phone VARCHAR(30) NOT NULL,
                    default_daily_km NUMERIC(18,2) DEFAULT 100,
                    default_daily_hours NUMERIC(18,2) DEFAULT 10,
                    base_monthly_rate NUMERIC(18,2) NOT NULL DEFAULT 40000,
                    rate_per_km NUMERIC(18,2) NOT NULL DEFAULT 18,
                    rate_per_hour NUMERIC(18,2) NOT NULL DEFAULT 90,
                    garage_rate_per_km NUMERIC(18,2) DEFAULT 0,
                    night_charge_rate NUMERIC(18,2) NOT NULL DEFAULT 350,
                    status VARCHAR(30) NOT NULL DEFAULT 'Active',
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS clients (
                    id VARCHAR(50) PRIMARY KEY,
                    name VARCHAR(150) NOT NULL,
                    company_name VARCHAR(200) NOT NULL,
                    gstin VARCHAR(20) DEFAULT '',
                    pan VARCHAR(20),
                    address VARCHAR(500) NOT NULL,
                    phone VARCHAR(50) NOT NULL,
                    email VARCHAR(100) NOT NULL,
                    contract_ref_no VARCHAR(100) NOT NULL,
                    contract_start_date VARCHAR(30),
                    contract_end_date VARCHAR(30),
                    payment_terms_days INT NOT NULL DEFAULT 30,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS invoices (
                    id VARCHAR(50) PRIMARY KEY,
                    invoice_number VARCHAR(50) UNIQUE NOT NULL,
                    invoice_date VARCHAR(30) NOT NULL,
                    due_date VARCHAR(30) NOT NULL,
                    billing_month VARCHAR(50) NOT NULL,
                    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
                    client_snapshot_json TEXT NOT NULL DEFAULT '{}',
                    contract_ref_no VARCHAR(100) DEFAULT '',
                    attached_duty_slip_ids_json TEXT NOT NULL DEFAULT '[]',
                    subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
                    tax_type VARCHAR(30) NOT NULL DEFAULT 'GST_5',
                    tax_rate NUMERIC(18,2) NOT NULL DEFAULT 5,
                    cgst NUMERIC(18,2) NOT NULL DEFAULT 0,
                    sgst NUMERIC(18,2) NOT NULL DEFAULT 0,
                    igst NUMERIC(18,2) NOT NULL DEFAULT 0,
                    is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
                    discount NUMERIC(18,2) NOT NULL DEFAULT 0,
                    advance_received NUMERIC(18,2) NOT NULL DEFAULT 0,
                    tds_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
                    tds_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
                    grand_total NUMERIC(18,2) NOT NULL DEFAULT 0,
                    net_payable NUMERIC(18,2) NOT NULL DEFAULT 0,
                    amount_in_words VARCHAR(500) NOT NULL DEFAULT '',
                    bank_details_json TEXT NOT NULL DEFAULT '{}',
                    trade_license_no VARCHAR(100) DEFAULT '',
                    company_gstin VARCHAR(50) DEFAULT '',
                    company_pan VARCHAR(50) DEFAULT '',
                    company_phone VARCHAR(50) DEFAULT '',
                    company_email VARCHAR(100) DEFAULT '',
                    company_address VARCHAR(500) DEFAULT '',
                    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
                    notes TEXT DEFAULT '',
                    terms_json TEXT NOT NULL DEFAULT '[]',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS invoice_items (
                    id VARCHAR(50) PRIMARY KEY,
                    invoice_id VARCHAR(50) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                    description VARCHAR(300) NOT NULL,
                    vehicle_reg_no VARCHAR(50),
                    vehicle_model VARCHAR(100),
                    billing_type VARCHAR(50) NOT NULL DEFAULT 'DutySlipAggregated',
                    base_package_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
                    total_run_km NUMERIC(18,2) NOT NULL DEFAULT 0,
                    rate_per_km NUMERIC(18,2) NOT NULL DEFAULT 0,
                    km_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_km NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_km_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_km_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_hours NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_hour_rate NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_hour_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    night_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    parking_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    toll_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    driver_allowance NUMERIC(18,2) NOT NULL DEFAULT 0,
                    other_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    amount NUMERIC(18,2) NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS duty_slips (
                    id VARCHAR(50) PRIMARY KEY,
                    duty_slip_no VARCHAR(50) NOT NULL,
                    date VARCHAR(30) NOT NULL,
                    vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
                    client_id VARCHAR(50) NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
                    route VARCHAR(200) NOT NULL,
                    driver_name VARCHAR(100) NOT NULL,
                    start_km NUMERIC(18,2) NOT NULL DEFAULT 0,
                    end_km NUMERIC(18,2) NOT NULL DEFAULT 0,
                    total_km NUMERIC(18,2) NOT NULL DEFAULT 0,
                    garage_out_km NUMERIC(18,2),
                    garage_in_km NUMERIC(18,2),
                    garage_km NUMERIC(18,2),
                    start_time VARCHAR(20) NOT NULL,
                    end_time VARCHAR(20) NOT NULL,
                    total_hours NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_hours NUMERIC(18,2) NOT NULL DEFAULT 0,
                    extra_duty VARCHAR(100),
                    extra_duty_charges NUMERIC(18,2),
                    night_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    parking_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    toll_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    driver_batta NUMERIC(18,2) NOT NULL DEFAULT 0,
                    fuel_charges NUMERIC(18,2) NOT NULL DEFAULT 0,
                    other_expenses NUMERIC(18,2) NOT NULL DEFAULT 0,
                    notes TEXT,
                    invoice_id VARCHAR(50) REFERENCES invoices(id) ON DELETE SET NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                -- Auto-Migration & Schema Evolution Patches (Idempotent for pre-existing databases):
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS garage_out_km NUMERIC(18,2);
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS garage_in_km NUMERIC(18,2);
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS garage_km NUMERIC(18,2);
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS extra_duty VARCHAR(100);
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS extra_duty_charges NUMERIC(18,2);
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS notes TEXT;
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(50);
                ALTER TABLE duty_slips ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pending';

                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS garage_rate_per_km NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS default_daily_km NUMERIC(18,2) DEFAULT 100;
                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS default_daily_hours NUMERIC(18,2) DEFAULT 10;
                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS base_monthly_rate NUMERIC(18,2) DEFAULT 40000;
                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(18,2) DEFAULT 18;
                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rate_per_hour NUMERIC(18,2) DEFAULT 90;
                ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS night_charge_rate NUMERIC(18,2) DEFAULT 350;

                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_snapshot_json TEXT DEFAULT '{}';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_ref_no VARCHAR(100) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS attached_duty_slip_ids_json TEXT DEFAULT '[]';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS trade_license_no VARCHAR(100) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_gstin VARCHAR(50) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_pan VARCHAR(50) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_phone VARCHAR(50) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_email VARCHAR(100) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_address VARCHAR(500) DEFAULT '';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms_json TEXT DEFAULT '[]';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bank_details_json TEXT DEFAULT '{}';
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_in_words VARCHAR(500) DEFAULT '';

                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS billing_type VARCHAR(50) DEFAULT 'DutySlipAggregated';
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS base_package_amount NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS total_run_km NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS rate_per_km NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS km_charges NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS extra_km NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS extra_km_rate NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS extra_km_charges NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS extra_hours NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS extra_hour_rate NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS extra_hour_charges NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS night_charges NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS parking_charges NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS toll_charges NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS driver_allowance NUMERIC(18,2) DEFAULT 0;
                ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS other_charges NUMERIC(18,2) DEFAULT 0;

                -- Safely drop legacy global unique constraint on duty_slip_no so fleet multi-vehicle sheets never collide
                ALTER TABLE duty_slips DROP CONSTRAINT IF EXISTS duty_slips_duty_slip_no_key;
                ALTER TABLE duty_slips DROP CONSTRAINT IF EXISTS duty_slips_duty_slip_no_unique;
                DROP INDEX IF EXISTS duty_slips_duty_slip_no_key;
                DROP INDEX IF EXISTS idx_duty_slips_duty_slip_no_unique;

                -- Query Optimization Indexes
                CREATE INDEX IF NOT EXISTS idx_duty_slips_duty_slip_no ON duty_slips(duty_slip_no);
                CREATE INDEX IF NOT EXISTS idx_duty_slips_vehicle_date ON duty_slips(vehicle_id, date);
                CREATE INDEX IF NOT EXISTS idx_duty_slips_status ON duty_slips(status);
                CREATE INDEX IF NOT EXISTS idx_duty_slips_client ON duty_slips(client_id);
                CREATE INDEX IF NOT EXISTS idx_duty_slips_vehicle ON duty_slips(vehicle_id);
                CREATE INDEX IF NOT EXISTS idx_duty_slips_invoice ON duty_slips(invoice_id);
                CREATE INDEX IF NOT EXISTS idx_invoices_month ON invoices(billing_month);
                CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
                CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
            ";

            using var cmd = context.Database.GetDbConnection().CreateCommand();
            cmd.CommandText = schemaDdl;
            if (context.Database.GetDbConnection().State != System.Data.ConnectionState.Open)
            {
                await context.Database.OpenConnectionAsync();
            }
            await cmd.ExecuteNonQueryAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

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

        // 2. Seed Master Admin Users
        if (!await context.Users.AnyAsync(u => u.Email == "biswajitpramanikrock@gmail.com"))
        {
            context.Users.Add(new User
            {
                Email = "biswajitpramanikrock@gmail.com",
                Name = "Biswajit Pramanik",
                PasswordHash = HashPassword("Biswajit@1989"),
                Role = "Administrator / Owner",
                CreatedAt = DateTime.UtcNow
            });
        }

        if (!await context.Users.AnyAsync(u => u.Email == "rahul@bishaltravels.com"))
        {
            context.Users.Add(new User
            {
                Email = "rahul@bishaltravels.com",
                Name = "Rahul",
                PasswordHash = HashPassword("Rahul@1998"),
                Role = "Super Administrator",
                CreatedAt = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

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

        // 5. Seed September 2026 Duty Slips for WB19R4841 (veh-1)
        if (!await context.DutySlips.AnyAsync(d => d.VehicleId == "veh-1" && d.Date.StartsWith("2026-09")))
        {
            var septemberSlips = new List<DutySlip>
            {
                new DutySlip
                {
                    Id = "ds-20260901-wb19r4841",
                    DutySlipNo = "DS-2026-0901",
                    Date = "2026-09-01",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 22334,
                    EndKm = 22455,
                    TotalKm = 122,
                    StartTime = "08:00",
                    EndTime = "22:50",
                    TotalHours = 15,
                    ExtraHours = 5,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "122 KM, 15 hrs, ₹2700",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260902-wb19r4841",
                    DutySlipNo = "DS-2026-0902",
                    Date = "2026-09-02",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 22455,
                    EndKm = 22586,
                    TotalKm = 131,
                    StartTime = "08:00",
                    EndTime = "21:05",
                    TotalHours = 13,
                    ExtraHours = 3,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 12,
                    Notes = "Toll ₹12, ₹2358",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260903-wb19r4841",
                    DutySlipNo = "DS-2026-0903",
                    Date = "2026-09-03",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 22589,
                    EndKm = 22793,
                    TotalKm = 204,
                    StartTime = "08:00",
                    EndTime = "19:30",
                    TotalHours = 11.5m,
                    ExtraHours = 1.5m,
                    NightCharges = 0,
                    ParkingCharges = 15,
                    TollCharges = 30,
                    Notes = "Toll ₹30, Parking ₹15, ₹2700",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260905-wb19r4841",
                    DutySlipNo = "DS-2026-0905",
                    Date = "2026-09-05",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 22808,
                    EndKm = 22952,
                    TotalKm = 144,
                    StartTime = "08:00",
                    EndTime = "22:30",
                    TotalHours = 15,
                    ExtraHours = 5,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "144 KM, 15 hrs, ₹2700",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260907-wb19r4841",
                    DutySlipNo = "DS-2026-0907",
                    Date = "2026-09-07",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 22957,
                    EndKm = 23058,
                    TotalKm = 107,
                    StartTime = "08:00",
                    EndTime = "21:30",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "107 KM, 14 hrs, ₹2160",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260908-wb19r4841",
                    DutySlipNo = "DS-2026-0908",
                    Date = "2026-09-08",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 23058,
                    EndKm = 23208,
                    TotalKm = 150,
                    StartTime = "08:00",
                    EndTime = "23:25",
                    TotalHours = 16,
                    ExtraHours = 6,
                    NightCharges = 350,
                    ParkingCharges = 200,
                    TollCharges = 0,
                    Notes = "Parking ₹200, Night halt ₹350, ₹3080",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260909-wb19r4841",
                    DutySlipNo = "DS-2026-0909",
                    Date = "2026-09-09",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 23208,
                    EndKm = 23340,
                    TotalKm = 132,
                    StartTime = "08:00",
                    EndTime = "23:30",
                    TotalHours = 16,
                    ExtraHours = 6,
                    NightCharges = 0,
                    ParkingCharges = 200,
                    TollCharges = 0,
                    Notes = "Parking ₹200, ₹3080",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260910-wb19r4841",
                    DutySlipNo = "DS-2026-0910",
                    Date = "2026-09-10",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 23341,
                    EndKm = 23483,
                    TotalKm = 142,
                    StartTime = "08:00",
                    EndTime = "22:00",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "142 KM, 14 hrs, ₹2556",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260911-wb19r4841",
                    DutySlipNo = "DS-2026-0911",
                    Date = "2026-09-11",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 23483,
                    EndKm = 23634,
                    TotalKm = 151,
                    StartTime = "08:00",
                    EndTime = "17:00",
                    TotalHours = 9,
                    ExtraHours = 0,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "151 KM, 9 hrs, ₹2718",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260912-wb19r4841",
                    DutySlipNo = "DS-2026-0912",
                    Date = "2026-09-12",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 28463,
                    EndKm = 28564,
                    TotalKm = 101,
                    StartTime = "07:00",
                    EndTime = "18:30",
                    TotalHours = 12,
                    ExtraHours = 2,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "101 KM, 12 hrs, ₹2160",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260914-wb19r4841",
                    DutySlipNo = "DS-2026-0914",
                    Date = "2026-09-14",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 28564,
                    EndKm = 28706,
                    TotalKm = 142,
                    StartTime = "07:30",
                    EndTime = "21:00",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "142 KM, 14 hrs, ₹2556",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260915-wb19r4841",
                    DutySlipNo = "DS-2026-0915",
                    Date = "2026-09-15",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 28706,
                    EndKm = 28933,
                    TotalKm = 227,
                    StartTime = "08:00",
                    EndTime = "22:30",
                    TotalHours = 15,
                    ExtraHours = 5,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "227 KM, 15 hrs, ₹4086",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260916-wb19r4841",
                    DutySlipNo = "DS-2026-0916",
                    Date = "2026-09-16",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 28937,
                    EndKm = 29046,
                    TotalKm = 109,
                    StartTime = "07:40",
                    EndTime = "23:30",
                    TotalHours = 16,
                    ExtraHours = 6,
                    NightCharges = 0,
                    ParkingCharges = 200,
                    TollCharges = 0,
                    Notes = "Parking ₹200, ₹3080",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260917-wb19r4841",
                    DutySlipNo = "DS-2026-0917",
                    Date = "2026-09-17",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29054,
                    EndKm = 29142,
                    TotalKm = 88,
                    StartTime = "08:00",
                    EndTime = "21:20",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "88 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260918-wb19r4841",
                    DutySlipNo = "DS-2026-0918",
                    Date = "2026-09-18",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29142,
                    EndKm = 29267,
                    TotalKm = 125,
                    StartTime = "08:00",
                    EndTime = "21:20",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "125 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260919-wb19r4841",
                    DutySlipNo = "DS-2026-0919",
                    Date = "2026-09-19",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29267,
                    EndKm = 29490,
                    TotalKm = 223,
                    StartTime = "08:00",
                    EndTime = "23:30",
                    TotalHours = 16,
                    ExtraHours = 6,
                    NightCharges = 0,
                    ParkingCharges = 200,
                    TollCharges = 0,
                    Notes = "223 KM, Parking ₹200, ₹4214",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260921-wb19r4841",
                    DutySlipNo = "DS-2026-0921",
                    Date = "2026-09-21",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29518,
                    EndKm = 29571,
                    TotalKm = 53,
                    StartTime = "08:00",
                    EndTime = "16:30",
                    TotalHours = 9,
                    ExtraHours = 0,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "53 KM, 9 hrs, ₹1800",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260922-wb19r4841",
                    DutySlipNo = "DS-2026-0922",
                    Date = "2026-09-22",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29572,
                    EndKm = 29689,
                    TotalKm = 117,
                    StartTime = "08:00",
                    EndTime = "21:30",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "117 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260923-wb19r4841",
                    DutySlipNo = "DS-2026-0923",
                    Date = "2026-09-23",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29702,
                    EndKm = 29816,
                    TotalKm = 114,
                    StartTime = "08:00",
                    EndTime = "21:50",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "114 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260924-wb19r4841",
                    DutySlipNo = "DS-2026-0924",
                    Date = "2026-09-24",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 29816,
                    EndKm = 30040,
                    TotalKm = 224,
                    StartTime = "08:00",
                    EndTime = "23:00",
                    TotalHours = 15,
                    ExtraHours = 5,
                    NightCharges = 0,
                    ParkingCharges = 200,
                    TollCharges = 0,
                    Notes = "224 KM, Parking ₹200, ₹4232",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260925-wb19r4841",
                    DutySlipNo = "DS-2026-0925",
                    Date = "2026-09-25",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 30040,
                    EndKm = 30168,
                    TotalKm = 128,
                    StartTime = "08:00",
                    EndTime = "21:40",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "128 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260927-wb19r4841",
                    DutySlipNo = "DS-2026-0927",
                    Date = "2026-09-27",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 30172,
                    EndKm = 30332,
                    TotalKm = 160,
                    StartTime = "07:00",
                    EndTime = "22:15",
                    TotalHours = 15,
                    ExtraHours = 5,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "160 KM, 15 hrs, ₹2880",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260928-wb19r4841",
                    DutySlipNo = "DS-2026-0928",
                    Date = "2026-09-28",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 30332,
                    EndKm = 30452,
                    TotalKm = 120,
                    StartTime = "06:00",
                    EndTime = "19:45",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "120 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260929-wb19r4841",
                    DutySlipNo = "DS-2026-0929",
                    Date = "2026-09-29",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 30452,
                    EndKm = 30615,
                    TotalKm = 163,
                    StartTime = "08:00",
                    EndTime = "21:40",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "163 KM, 14 hrs, ₹2934",
                    Status = "Pending"
                },
                new DutySlip
                {
                    Id = "ds-20260930-wb19r4841",
                    DutySlipNo = "DS-2026-0930",
                    Date = "2026-09-30",
                    VehicleId = "veh-1",
                    ClientId = "client-1",
                    DriverName = "Ramesh Das",
                    Route = "Local Corporate Duty",
                    StartKm = 30615,
                    EndKm = 30650,
                    TotalKm = 35,
                    StartTime = "08:00",
                    EndTime = "21:45",
                    TotalHours = 14,
                    ExtraHours = 4,
                    NightCharges = 0,
                    ParkingCharges = 0,
                    TollCharges = 0,
                    Notes = "35 KM, 14 hrs, ₹2520",
                    Status = "Pending"
                }
            };

            context.DutySlips.AddRange(septemberSlips);
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

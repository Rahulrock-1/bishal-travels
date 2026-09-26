using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using BishalTravels.Api.Common;
using BishalTravels.Api.Data;
using BishalTravels.Api.Middleware;
using BishalTravels.Api.Repositories;
using BishalTravels.Api.Services;
using BishalTravels.Api.Services.Implementations;
using BishalTravels.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Dynamic Port Configuration for Render ($PORT)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// 2. Add MVC Controllers & JSON Formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new()
        {
            Title = "Bishal Travels Fleet & Invoice API (Clean Architecture & CQRS)",
            Version = "v1",
            Description = "Decoupled Clean Architecture with CQRS, Unit of Work, Repository Layer, and Custom Middlewares for Bishal Travels Fleet & Corporate Invoicing."
        });
    });

// 3. Configure Database Connection (Supabase PostgreSQL / InMemory Fallback)
var defaultConn = builder.Configuration.GetConnectionString("DefaultConnection");
var rawConnectionString = !string.IsNullOrWhiteSpace(defaultConn)
    ? defaultConn
    : (Environment.GetEnvironmentVariable("DATABASE_URL")
       ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"));

var effectiveConnectionString = ConvertDatabaseUrlToNpgsql(rawConnectionString);

if (!string.IsNullOrWhiteSpace(effectiveConnectionString))
{
    builder.Services.AddDbContext<BishalTravelsDbContext>(options =>
        options.UseNpgsql(effectiveConnectionString, npgsqlOptions =>
        {
            npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3);
            npgsqlOptions.CommandTimeout(30);
        }));
}
else
{
    // Local / Dev InMemory fallback when no Supabase credentials configured yet
    builder.Services.AddDbContext<BishalTravelsDbContext>(options =>
        options.UseInMemoryDatabase("BishalTravelsDevDb"));
}

// 4. Data Access Layer (Repositories & Unit of Work)
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IDutySlipRepository, DutySlipRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<ICompanyProfileRepository, CompanyProfileRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// 5. Domain & Application Services
builder.Services.AddScoped<ICalculationService, CalculationService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IDutySlipService, DutySlipService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IBackupService, BackupService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// 6. CQRS Mediator & Request Handlers Registration
builder.Services.AddCqrs(typeof(Program).Assembly);

// 7. CORS Policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

// 8. Database Auto-Migration & Seed on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<BishalTravelsDbContext>();
        await DbInitializer.InitializeAsync(dbContext);
        app.Logger.LogInformation("Database successfully initialized and seeded with Bishal Travels initial records.");
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred during database initialization.");
    }
}

// 9. HTTP Pipeline Middlewares
app.UseCustomMiddlewares(); // Global Exception Handling + Request Logging & Timing Header
app.UseCors("AllowAllOrigins");

// Enable Swagger in all environments for API testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Bishal Travels API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthorization();
app.MapControllers();

app.Run();

// --- Helper for parsing standard postgres:// URLs from Supabase / Render ---
static string? ConvertDatabaseUrlToNpgsql(string? databaseUrl)
{
    if (string.IsNullOrWhiteSpace(databaseUrl)) return null;

    if (!databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
        !databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
    {
        return databaseUrl; // Already a standard key-value connection string
    }

    try
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "";
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
    }
    catch
    {
        return databaseUrl;
    }
}

using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BishalTravels.Api.Common;
using BishalTravels.Api.Data;
using BishalTravels.Api.Messaging;
using BishalTravels.Api.Middleware;
using BishalTravels.Api.Repositories;
using BishalTravels.Api.Security;
using BishalTravels.Api.Services;
using BishalTravels.Api.Services.Implementations;
using BishalTravels.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Dynamic Port Configuration for Render ($PORT)
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// 2. Server-Side Reverse Proxy (Forwarded Headers) & HTTP Client
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});
builder.Services.AddHttpClient("ServerSideProxyClient");
builder.Services.AddHttpForwarder();

// 3. Add MVC Controllers & JSON Formatting
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// 4. JWT Authentication & Authorization ("Without authentication no one can access")
var secretKey = builder.Configuration["Jwt:Key"] 
    ?? Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
    ?? JwtTokenGenerator.DefaultSecretKey;

var issuer = builder.Configuration["Jwt:Issuer"] 
    ?? Environment.GetEnvironmentVariable("JWT_ISSUER") 
    ?? JwtTokenGenerator.DefaultIssuer;

var audience = builder.Configuration["Jwt:Audience"] 
    ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
    ?? JwtTokenGenerator.DefaultAudience;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

// 5. RabbitMQ Event Bus & Background Worker
builder.Services.AddSingleton<IMessageBus, RabbitMqMessageBus>();
builder.Services.AddHostedService<RabbitMqEventConsumer>();

// 6. Swagger API Documentation with JWT Bearer Security
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new()
    {
        Title = "Bishal Travels Fleet & Invoice API (Clean Architecture & CQRS)",
        Version = "v1",
        Description = "Decoupled Clean Architecture with CQRS, Unit of Work, Repository Layer, JWT Authentication, RabbitMQ Message Queue, and Server-Side Proxy."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token: Bearer {your token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// 7. Configure Database Connection (Supabase PostgreSQL / InMemory Fallback)
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

// 8. Data Access Layer (Repositories & Unit of Work)
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IVehicleRepository, VehicleRepository>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IDutySlipRepository, DutySlipRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<ICompanyProfileRepository, CompanyProfileRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// 9. Domain & Application Services
builder.Services.AddScoped<ICalculationService, CalculationService>();
builder.Services.AddScoped<ICompanyService, CompanyService>();
builder.Services.AddScoped<IVehicleService, VehicleService>();
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IDutySlipService, DutySlipService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IBackupService, BackupService>();
builder.Services.AddScoped<IAuthService, AuthService>();

// 10. CQRS Mediator & Request Handlers Registration
builder.Services.AddCqrs(typeof(Program).Assembly);

// 11. CORS Policy
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

// 12. Database Auto-Migration & Seed on Startup
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

// 13. HTTP Pipeline Middlewares
app.UseForwardedHeaders(); // Server-side reverse proxy header forwarding
app.UseCustomMiddlewares(); // Global Exception Handling + Request Logging & Timing Header
app.UseCors("AllowAllOrigins");

// Enable Swagger in all environments for API testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Bishal Travels API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthentication();
app.UseAuthorization();

// 14. Health Check Endpoint for Database & Cloud connectivity probe
app.MapGet("/health", async (BishalTravelsDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return Results.Ok(new
        {
            status = "Healthy",
            database = canConnect ? "Connected" : "Disconnected",
            service = "Bishal Travels Fleet & Invoicing API",
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            status = "Degraded",
            database = "Unreachable",
            error = ex.Message
        }, statusCode: 503);
    }
}).AllowAnonymous();

app.MapGet("/api/health", async (BishalTravelsDbContext dbContext) =>
{
    try
    {
        var canConnect = await dbContext.Database.CanConnectAsync();
        return Results.Ok(new
        {
            status = "Healthy",
            database = canConnect ? "Connected" : "Disconnected",
            timestamp = DateTime.UtcNow
        });
    }
    catch (Exception ex)
    {
        return Results.Json(new
        {
            status = "Degraded",
            database = "Unreachable",
            error = ex.Message
        }, statusCode: 503);
    }
}).AllowAnonymous();

// 15. Server-Side Reverse Proxy to RabbitMQ Management UI
app.MapGet("/rabbitmq", () => Results.Redirect("/rabbitmq/"));
app.MapForwarder("/rabbitmq/{**catch-all}", "http://127.0.0.1:15672");

// 16. Root Discovery Endpoint
app.MapGet("/", () => Results.Json(new
{
    service = "Bishal Travels Fleet & Invoicing API",
    status = "Online",
    version = "1.0.0",
    docs = "/swagger",
    health = "/health",
    rabbitmq = "/rabbitmq/"
})).AllowAnonymous();

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

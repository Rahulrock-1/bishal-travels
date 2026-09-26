# Structured Clarification & Technical Decisions Log

**Project:** Bishal Travels Fleet & Invoice Management System  
**Date:** 2026-09-26  

---

| Item ID | Question / Ambiguity | Decision / Resolution | Impacted Artifacts |
| :--- | :--- | :--- | :--- |
| **CLR-01** | Which .NET runtime version and architecture should be used? | .NET 8 LTS (`net8.0`) ASP.NET Core Web API with clean modular layout (Controllers, Services, Models, Data, DTOs). Fully cross-platform and production-proven. | `architecture.md`, `BishalTravels.Api.csproj`, `Dockerfile` |
| **CLR-02** | How should Supabase PostgreSQL connection strings and SSL mode be handled? | Support standard PostgreSQL connection string (`Host=...;Database=postgres;Username=postgres;Password=...;SSL Mode=Require;Trust Server Certificate=true;`) and Supabase Pooler (`port 6543` / `port 5432`). In addition, provide SQLite / in-memory fallback for local dev/testing when cloud DB is not configured. | `appsettings.json`, `Program.cs`, `BishalTravelsDbContext.cs` |
| **CLR-03** | How should Render hosting be configured? | Render Web Service using a multi-stage Docker build (`mcr.microsoft.com/dotnet/sdk:8.0` build -> `mcr.microsoft.com/dotnet/aspnet:8.0` runtime). Listen on port supplied by `$PORT` (default 8080) and provide `/health` probe for zero-downtime health checking. Specify via `render.yaml`. | `Dockerfile`, `render.yaml`, `HealthController.cs` |
| **CLR-04** | How to handle Invoice Item structures and Client Snapshots in relational PostgreSQL? | Invoices store the client snapshot and itemized billings as strongly-typed relational entities (`InvoiceItems`) with JSON serialization backups where beneficial, ensuring foreign key safety while allowing exact historical immutability of invoices. | `Models/Invoice.cs`, `Models/InvoiceItem.cs` |
| **CLR-05** | How should the React frontend integrate with the backend? | Create `src/services/api.ts` with comprehensive typed methods. AppContext will initialize by calling the backend API, syncing local state, and providing seamless offline fallback to LocalStorage if the backend is offline. | `src/services/api.ts`, `src/context/AppContext.tsx`, `src/context/AuthContext.tsx` |
| **CLR-06** | How to ensure Supabase database schema can be created easily by the user? | Include both automatic EF Core `EnsureCreatedAsync()` / migration capability, AND a standalone `Supabase_Schema.sql` script that the user can directly paste into Supabase SQL Editor. | `Supabase_Schema.sql`, `DbInitializer.cs` |
| **CLR-07** | How to seed initial Bishal Travels business data? | Automatically seed the database on first run with Bishal Travels initial company profile, sample fleet, clients, duty slips, and invoices if tables are empty. | `Data/DbInitializer.cs` |


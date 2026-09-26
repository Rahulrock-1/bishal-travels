# Developer Tasks Breakdown (tasks.md)

**Project:** Bishal Travels Fleet & Invoice Management System (.NET + Supabase + Render)  
**Status:** In Execution  

---

## Phase 1: Backend Scaffolding & Relational Models
- [x] **Task 1.1:** Scaffold ASP.NET Core 8 Web API project `backend/BishalTravels.Api`.  
  *Files:* `backend/BishalTravels.Api/BishalTravels.Api.csproj`  
  *Verification:* `dotnet build` compiles successfully.

- [x] **Task 1.2:** Add EF Core & PostgreSQL NuGet packages (`Npgsql.EntityFrameworkCore.PostgreSQL`, `Swashbuckle.AspNetCore`).  
  *Files:* `backend/BishalTravels.Api/BishalTravels.Api.csproj`  
  *Verification:* Package references resolved without version conflicts.

- [x] **Task 1.3:** Implement entity domain models: `CompanyProfile`, `Vehicle`, `Client`, `DutySlip`, `Invoice`, `InvoiceItem`.  
  *Files:* `backend/BishalTravels.Api/Models/*.cs`  
  *Verification:* Types match frontend TypeScript definitions.

- [x] **Task 1.4:** Implement `BishalTravelsDbContext` with fluent PostgreSQL mapping, `decimal(18,2)` precision, relationships, and indexes.  
  *Files:* `backend/BishalTravels.Api/Data/BishalTravelsDbContext.cs`  
  *Verification:* Model builder passes EF Core validation.

- [x] **Task 1.5:** Implement `DbInitializer` with seed data for Bishal Travels fleet, clients, duty slips, and initial invoice.  
  *Files:* `backend/BishalTravels.Api/Data/DbInitializer.cs`  
  *Verification:* Tables automatically populate with initial data when empty.

- [x] **Task 1.6:** Generate standalone DDL script `Supabase_Schema.sql` for instant execution in Supabase SQL Editor.  
  *Files:* `backend/Supabase_Schema.sql`  
  *Verification:* Script executes cleanly in PostgreSQL.

---

## Phase 2: RESTful API Controllers & Domain Services
- [x] **Task 2.1:** Implement domain `CalculationService` for GST (CGST/SGST/IGST), TDS, overtime, and Indian number-to-words currency conversion.  
  *Files:* `backend/BishalTravels.Api/Services/CalculationService.cs`  
  *Verification:* Unit tests confirm arithmetic accuracy.

- [x] **Task 2.2:** Implement `CompanyController` (`GET /api/company`, `PUT /api/company`).  
  *Files:* `backend/BishalTravels.Api/Controllers/CompanyController.cs`  
  *Verification:* Company profile returns official Bishal Travels bank and trade license details.

- [x] **Task 2.3:** Implement `VehiclesController` (`GET`, `POST`, `PUT`, `DELETE /api/vehicles`).  
  *Files:* `backend/BishalTravels.Api/Controllers/VehiclesController.cs`  
  *Verification:* Fleet CRUD operations pass validation.

- [x] **Task 2.4:** Implement `ClientsController` (`GET`, `POST`, `PUT`, `DELETE /api/clients`).  
  *Files:* `backend/BishalTravels.Api/Controllers/ClientsController.cs`  
  *Verification:* Corporate clients and contract info are saved and queried.

- [x] **Task 2.5:** Implement `DutySlipsController` (`GET`, `POST`, `PUT`, `DELETE`, `GET /api/dutyslips/unbilled`).  
  *Files:* `backend/BishalTravels.Api/Controllers/DutySlipsController.cs`  
  *Verification:* Auto-calculates total KM and run hours; unbilled filter returns only pending slips.

- [x] **Task 2.6:** Implement `InvoicesController` (`GET`, `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`, `PATCH /{id}/status`).  
  *Files:* `backend/BishalTravels.Api/Controllers/InvoicesController.cs`  
  *Verification:* Invoicing marks attached duty slips as billed and calculates net payable.

- [x] **Task 2.7:** Implement `ReportsController` (`GET /api/reports/monthly`).  
  *Files:* `backend/BishalTravels.Api/Controllers/ReportsController.cs`  
  *Verification:* Monthly performance metrics aggregate revenue and vehicle run stats.

- [x] **Task 2.8:** Implement `BackupController` (`GET /api/backup/export`, `POST /api/backup/restore`, `POST /api/backup/reset`).  
  *Files:* `backend/BishalTravels.Api/Controllers/BackupController.cs`  
  *Verification:* JSON export/import matches frontend backup format.

- [x] **Task 2.9:** Implement `HealthController` (`GET /health`).  
  *Files:* `backend/BishalTravels.Api/Controllers/HealthController.cs`  
  *Verification:* Returns 200 OK with database connection health.

- [x] **Task 2.10:** Configure `Program.cs` (CORS policies, Swagger OpenAPI, Supabase connection string resolution, Port binding).  
  *Files:* `backend/BishalTravels.Api/Program.cs`  
  *Verification:* Swagger UI loads at `/swagger`.

---

## Phase 3: Cloud Deployment Infrastructure (Render & Supabase)
- [x] **Task 3.1:** Create optimized multi-stage `Dockerfile`.  
  *Files:* `backend/Dockerfile`  
  *Verification:* Docker build generates clean image.

- [x] **Task 3.2:** Create `render.yaml` infrastructure-as-code blueprint for Render Web Service deployment.  
  *Files:* `render.yaml`  
  *Verification:* Validated against Render Blueprint specification.

- [x] **Task 3.3:** Document deployment guide with step-by-step Supabase & Render instructions.  
  *Files:* `DEPLOYMENT.md`  
  *Verification:* End-to-end instructions for zero-friction setup.

---

## Phase 4: Frontend API Integration & Cloud Synchronization
- [x] **Task 4.1:** Create typed API client `src/services/api.ts` connecting all frontend actions to the .NET backend.  
  *Files:* `src/services/api.ts`  
  *Verification:* Functions return typed Promises matching existing data models.

- [x] **Task 4.2:** Integrate API service into `src/context/AppContext.tsx` with offline fallback resilience.  
  *Files:* `src/context/AppContext.tsx`  
  *Verification:* State is pulled from API on mount; mutations sync to backend.

- [x] **Task 4.3:** Integrate `src/context/AuthContext.tsx` with API login and master credentials fallback.  
  *Files:* `src/context/AuthContext.tsx`  
  *Verification:* Login authenticates seamlessly.

- [x] **Task 4.4:** Add Cloud Connection Status Badge in the navigation header.  
  *Files:* `src/components/layout/Navbar.tsx`  
  *Verification:* Shows "Cloud (Supabase)" or "Offline (LocalStorage)".

---

## Phase 5: Automated Verification & SDLC Release
- [x] **Task 5.1:** Create automated xUnit test project `backend/BishalTravels.Tests`.  
  *Files:* `backend/BishalTravels.Tests/*.cs`  
  *Verification:* `dotnet test` passes 100%.

- [x] **Task 5.2:** Verify frontend production compilation.  
  *Verification:* `npm run build` exits with code 0.

- [x] **Task 5.3:** Finalize SDLC verification artifacts (`test-report.md`, `review.md`, `security-audit.md`, `convergence.md`, `release-notes.md`).  


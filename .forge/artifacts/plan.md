# Technical Execution Plan (plan.md)

**Project:** Bishal Travels Fleet & Invoice Management System (.NET + Supabase + Render)  
**Standard:** Spec Kit SDD Technical Plan  
**Status:** Approved  
**Last Updated:** 2026-09-26  

---

## 1. Architecture Alignment & Technology Decisions
- **Backend Runtime:** .NET 8 LTS (`net8.0`) ASP.NET Core Web API
- **ORM & Data Provider:** Entity Framework Core 8 + `Npgsql.EntityFrameworkCore.PostgreSQL`
- **Database Engine:** Supabase Managed PostgreSQL (with schema migration & script)
- **Containerization & Cloud Deployment:** Multi-stage Dockerfile + Render Web Service (`render.yaml`)
- **Frontend Stack:** React 18 + TypeScript + Vite + Tailwind CSS
- **Integration Approach:** RESTful API service (`src/services/api.ts`) + AppContext hybrid sync with offline fallback

---

## 2. Phased Execution Roadmap

### Phase 1: Backend Scaffolding & Relational Modeling
- **Goal:** Create `backend/BishalTravels.Api` project, configure dependencies (`Npgsql.EntityFrameworkCore.PostgreSQL`, `Swashbuckle.AspNetCore`).
- **Deliverables:**
  - `BishalTravels.Api.csproj`
  - Entity Models: `CompanyProfile`, `Vehicle`, `Client`, `DutySlip`, `Invoice`, `InvoiceItem`
  - Data Context: `BishalTravelsDbContext` with fluent PostgreSQL mapping, precision configuration, and indexes
  - Database Initializer: `DbInitializer` seeding initial Bishal Travels business data
  - DDL Export: `Supabase_Schema.sql` for instant manual execution in Supabase Query Editor

### Phase 2: RESTful API Controllers & Core Domain Services
- **Goal:** Expose all business capabilities through idiomatic REST endpoints with validation.
- **Deliverables:**
  - `CompanyController`: Get and update company/bank profile
  - `VehiclesController`: CRUD operations for fleet and driver details
  - `ClientsController`: Corporate client CRM and contract tracking
  - `DutySlipsController`: Trip run logging, KM/hour calculation, pending/billed filtering
  - `InvoicesController`: Creation with auto-aggregation of duty slips, calculation, status lifecycle
  - `ReportsController`: Monthly performance, vehicle utilization, and billing metrics
  - `BackupController`: Full JSON database export, import/restore, and reset to seed
  - `HealthController`: Liveness/readiness probe (`/health`)

### Phase 3: Containerization & Render Deployment Configuration
- **Goal:** Package backend into an optimized Docker container and define Render blueprint.
- **Deliverables:**
  - Production multi-stage `backend/Dockerfile` with non-root security and dynamic `$PORT` binding
  - Infrastructure-as-code `render.yaml` for 1-click Render Web Service deployment
  - Comprehensive deployment guide in documentation

### Phase 4: Frontend API Integration & Cloud Synchronization
- **Goal:** Connect React UI to the .NET backend API with offline fallback resilience.
- **Deliverables:**
  - `src/services/api.ts`: Strongly-typed API client covering all endpoints
  - `src/context/AppContext.tsx`: Cloud-first data synchronization with automatic fallback
  - `src/context/AuthContext.tsx`: Cloud auth with master admin fallback
  - UI Cloud Status Indicator in Navbar

### Phase 5: Automated Verification, Testing & Release
- **Goal:** Complete automated tests, verify end-to-end operation, and finalize SDLC release documents.
- **Deliverables:**
  - `backend/BishalTravels.Tests`: Automated unit and integration tests (`dotnet test`)
  - Frontend production build verification (`npm run build`)
  - Verification artifacts (`test-report.md`, `review.md`, `security-audit.md`, `convergence.md`, `release-notes.md`)


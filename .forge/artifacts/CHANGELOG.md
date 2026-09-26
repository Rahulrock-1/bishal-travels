# Changelog

All notable changes to **Bishal Travels Fleet & Invoice Management System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-26

### Added
- **ASP.NET Core 8 Web API Backend (`backend/BishalTravels.Api`)**:
  - Full RESTful controllers: `CompanyController`, `VehiclesController`, `ClientsController`, `DutySlipsController`, `InvoicesController`, `ReportsController`, `BackupController`, `HealthController`, and `AuthController`.
  - Precision domain `CalculationService` for trip readings (KM, hours, overtime), Indian GST (CGST/SGST vs IGST), TDS, and Indian currency numbering words converter.
  - Entity Framework Core 8 with Npgsql PostgreSQL provider, fluent relationships, decimal precision `(18,2)`, and indexes.
  - Automated database seeding (`DbInitializer`) with initial Bishal Travels business credentials, fleet, and corporate client records.
  - Interactive Swagger / OpenAPI documentation UI at `/swagger`.
- **Supabase Managed PostgreSQL Support**:
  - Standalone SQL script [`backend/Supabase_Schema.sql`](file:///D:/Invoice%20System/backend/Supabase_Schema.sql) for 1-click execution in Supabase SQL Editor.
  - Support for Supabase connection pooling (port 6543) and direct connection (port 5432).
- **Render Cloud Containerization & Deployment**:
  - Multi-stage production [`backend/Dockerfile`](file:///D:/Invoice%20System/backend/Dockerfile) with dynamic `$PORT` binding.
  - Infrastructure-as-code [`render.yaml`](file:///D:/Invoice%20System/render.yaml) for automated continuous deployment.
  - Comprehensive deployment guide in [`DEPLOYMENT.md`](file:///D:/Invoice%20System/DEPLOYMENT.md).
- **React Frontend Integration**:
  - Strongly-typed API client in [`src/services/api.ts`](file:///D:/Invoice%20System/src/services/api.ts).
  - Upgraded [`src/context/AppContext.tsx`](file:///D:/Invoice%20System/src/context/AppContext.tsx) to sync with .NET Web API and provide resilient offline LocalStorage fallback.
  - Upgraded [`src/context/AuthContext.tsx`](file:///D:/Invoice%20System/src/context/AuthContext.tsx) to support API authentication with offline master credential fallback.
  - Cloud connection status badge with 1-click sync in [`src/components/layout/Navbar.tsx`](file:///D:/Invoice%20System/src/components/layout/Navbar.tsx).
- **Automated Verification & Test Suite (`backend/BishalTravels.Tests`)**:
  - 9 automated xUnit tests validating calculations, GST splitting, Indian currency words, and controller CRUD operations (100% pass rate).


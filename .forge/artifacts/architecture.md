# Technical Architecture Document (architecture.md)

**Project:** Bishal Travels Fleet & Invoice Management System (.NET + Supabase + Render)  
**Authoring Engine:** BMAD Architecture Engine (v2.4.0)  
**Status:** Approved  
**Last Updated:** 2026-09-26  

---

## 1. Executive Summary & Architectural Goals
This document specifies the technical architecture for the **Bishal Travels** enterprise travel invoicing and fleet management solution. It defines the migration from a local-only browser model to a cloud-native architecture combining an **ASP.NET Core 8 Web API** backend, a managed **Supabase PostgreSQL** database, a zero-maintenance containerized deployment on **Render**, and seamless bi-directional integration with the **React + Vite + TypeScript** frontend.

### Core Architectural Drivers
- **Financial Precision:** Strict decimal arithmetic (`decimal(18,2)`) in C# and PostgreSQL for all GST tax calculations, TDS deductions, and advance amounts.
- **Relational Integrity:** Foreign keys linking Invoices to DutySlips, Clients, and Vehicles with idempotent update semantics.
- **High Availability & Low Cost:** Render Web Service container auto-healing paired with Supabase PostgreSQL connection pooling.
- **Resilient Hybrid Sync:** Frontend client executes against the cloud API as primary source of truth, with graceful fallback to browser storage when disconnected.

---

## 2. System Context & C4 Architecture Diagrams

### C4 Level 1: System Context Diagram

```mermaid
flowchart TD
    User["👤 Bishal Travels Admin / Dispatcher / Accounts"]
    
    subgraph CloudInfrastructure ["Cloud Hosting & Services"]
        SPA["💻 React 18 + Vite SPA Frontend
(Vercel / Render Static / Localhost)"]
        
        API["⚙️ ASP.NET Core 8 Web API
(Dockerized Web Service on Render)"]
        
        SupaDB[("🐘 Supabase Managed PostgreSQL
(Tables, Views, Indexes, JSONB)")]
    end
    
    User -->|HTTPS Browser Session| SPA
    SPA -->|RESTful JSON API over HTTPS| API
    API -->|Npgsql EF Core TCP/SSL 5432 or 6543| SupaDB
```

### C4 Level 2: Container & Service Interaction Diagram

```mermaid
flowchart LR
    subgraph FrontendApp ["Frontend Application (React + Vite)"]
        UI["React Views
(Invoices, Slips, Fleet, Clients)"]
        Context["AppContext & AuthContext"]
        ApiClient["api.ts (REST Service Layer)"]
        LocalCache["LocalStorage Fallback"]
        
        UI --> Context
        Context --> ApiClient
        Context -.-> LocalCache
    end

    subgraph BackendApp ["Backend API (.NET 8 on Render)"]
        Controllers["API Controllers
(Company, Vehicles, Clients, DutySlips, Invoices, Reports, Health)"]
        Services["Business Services
(Tax & Overtime Calculator, NumberToWords)"]
        EFCore["Entity Framework Core (DbContext)"]
        Health["/health Endpoint"]
        
        Controllers --> Services
        Controllers --> EFCore
    end

    subgraph DatabaseLayer ["Supabase Cloud (AWS / GCP region)"]
        Tables["PostgreSQL Tables:
- company_profiles
- vehicles
- clients
- duty_slips
- invoices
- invoice_items"]
    end

    ApiClient -->|HTTP REST| Controllers
    EFCore -->|Npgsql Connection Pool| Tables
```

---

## 3. Database Schema (Supabase PostgreSQL ERD)

```mermaid
erDiagram
    COMPANY_PROFILE {
        int id PK
        string business_name
        string trade_license_no
        string gstin
        string pan
        string address
        string phone
        string email
        string bank_name
        string account_holder
        string account_number
        string ifsc_code
        string branch_name
        string upi_id
        string signatory_name
        string signatory_title
        boolean is_configured
    }

    VEHICLE {
        string id PK
        string reg_number UK
        string model
        string type
        string fuel_type
        string driver_name
        string driver_phone
        decimal base_monthly_rate
        decimal rate_per_km
        decimal rate_per_hour
        decimal night_charge_rate
        string status
        string notes
    }

    CLIENT {
        string id PK
        string name
        string company_name
        string gstin
        string pan
        string address
        string phone
        string email
        string contract_ref_no
        int payment_terms_days
        string notes
    }

    DUTY_SLIP {
        string id PK
        string duty_slip_no UK
        date date
        string vehicle_id FK
        string client_id FK
        string route
        string driver_name
        decimal start_km
        decimal end_km
        decimal total_km
        string start_time
        string end_time
        decimal total_hours
        decimal extra_hours
        decimal night_charges
        decimal parking_charges
        decimal toll_charges
        decimal driver_batta
        decimal fuel_charges
        decimal other_expenses
        string invoice_id FK
        string status
    }

    INVOICE {
        string id PK
        string invoice_number UK
        date invoice_date
        date due_date
        string billing_month
        string client_id FK
        string contract_ref_no
        decimal subtotal
        string tax_type
        decimal tax_rate
        decimal cgst
        decimal sgst
        decimal igst
        boolean is_interstate
        decimal discount
        decimal advance_received
        decimal tds_rate
        decimal tds_amount
        decimal grand_total
        decimal net_payable
        string amount_in_words
        string status
        timestamp created_at
    }

    INVOICE_ITEM {
        string id PK
        string invoice_id FK
        string description
        string vehicle_reg_no
        string billing_type
        decimal base_package_amount
        decimal total_run_km
        decimal rate_per_km
        decimal km_charges
        decimal extra_km
        decimal extra_km_rate
        decimal extra_km_charges
        decimal extra_hours
        decimal extra_hour_rate
        decimal extra_hour_charges
        decimal night_charges
        decimal parking_charges
        decimal toll_charges
        decimal driver_allowance
        decimal other_charges
        decimal amount
    }

    VEHICLE ||--o{ DUTY_SLIP : "assigned to"
    CLIENT ||--o{ DUTY_SLIP : "ordered by"
    CLIENT ||--o{ INVOICE : "billed to"
    INVOICE ||--o{ DUTY_SLIP : "aggregates"
    INVOICE ||--|{ INVOICE_ITEM : "contains"
```

---

## 4. Render Deployment Architecture

```
                               ┌───────────────────────────┐
                               │   GitHub Repository       │
                               │   (master / main)         │
                               └─────────────┬─────────────┘
                                             │ git push
                                             ▼
                               ┌───────────────────────────┐
                               │   Render Web Service      │
                               │   (Docker Environment)    │
                               ├───────────────────────────┤
                               │ • Multi-stage Docker build│
                               │ • Exposes PORT ($PORT)    │
                               │ • /health probe check     │
                               │ • Environment Variables:  │
                               │   - ConnectionStrings__   │
                               │     DefaultConnection     │
                               │   - ASPNETCORE_ENV=...    │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │ Supabase Cloud PostgreSQL │
                               │ (aws-0-ap-south-1.pooler) │
                               └───────────────────────────┘
```

---

## 5. Architectural Decision Records (ADRs)

| ADR ID | Decision | Justification | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| **ADR-001** | ASP.NET Core 8 Web API Framework | Enterprise-grade speed, native async I/O, built-in dependency injection, cross-platform Docker containerization. | Node/Express, Python FastAPI, Go Fiber |
| **ADR-002** | Supabase Managed PostgreSQL | Managed cloud PostgreSQL with automated backup, connection pooler (PgBouncer/Supavisor), and free tier. | Self-hosted PostgreSQL on VM, MongoDB, SQLite |
| **ADR-003** | Render Cloud Web Service | Native Docker build support, automatic SSL, free/starter tiers, continuous deployment on Git push. | AWS ECS, Azure App Service, Heroku |
| **ADR-004** | Dual Storage Strategy (API Primary + LocalStorage Fallback) | Ensures zero user disruption if internet connectivity drops during duty slip logging in transit. | Pure online-only (fails offline), Pure local (no cross-device sync) |
| **ADR-005** | Standalone SQL DDL Script + EF Core Auto-Migration | Allows instant schema creation in Supabase SQL editor without demanding CLI tools from non-technical operators. | Pure code-first migrations requiring `dotnet ef` tools |


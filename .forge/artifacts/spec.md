# Software Specification Document (spec.md)

**Feature / System:** Bishal Travels .NET 8 Web API & Supabase PostgreSQL Backend Integration  
**Format:** Spec Kit Spec-Driven Development (SDD)  
**Status:** Approved  
**Date:** 2026-09-26  

---

## 1. Problem Statement & User Value
Bishal Travels requires a robust, cloud-hosted ASP.NET Core 8 Web API backend connected to a managed Supabase PostgreSQL database, ready for continuous deployment on Render, and fully integrated with the React frontend. This eliminates local browser data loss, allows multi-user concurrent operations (dispatchers + billing operators), and ensures strict financial integrity for corporate invoicing.

---

## 2. User Stories & Acceptance Criteria

### User Story 1: Company Profile & Bank Details Management
> **As the** business owner (Biswajit Pramanik)  
> **I want to** configure and persist Bishal Travels company credentials and bank details in Supabase PostgreSQL via the .NET API  
> **So that** every invoice and duty slip annexure is automatically stamped with official Trade License, GSTIN, PAN, Bank IFSC, and UPI details.

#### Acceptance Scenarios (Given-When-Then)
- **Scenario 1.1: Fetch Configured Profile**
  - **Given** the .NET API is running and connected to Supabase
  - **When** the frontend issues `GET /api/company`
  - **Then** the API returns HTTP 200 with the active `CompanyProfile` JSON.
- **Scenario 1.2: Update Profile and Auto-Population**
  - **Given** updated bank account number, IFSC code, or Trade License
  - **When** the user saves changes via `PUT /api/company`
  - **Then** the database record is updated idempotently and all subsequent invoice generations reflect the updated details.

---

### User Story 2: Vehicle Fleet & Driver Management
> **As a** fleet supervisor  
> **I want to** create, update, list, and soft-manage vehicles and drivers  
> **So that** duty slips and monthly package billing have accurate vehicle rates, fuel types, and driver contact info.

#### Acceptance Scenarios
- **Scenario 2.1: Register New Fleet Vehicle**
  - **Given** vehicle payload with Registration Number (`WB 02 AL 4589`), Model (`Dzire`), Type (`Sedan`), Driver (`Raju Shaw`), and default base rates
  - **When** `POST /api/vehicles` is called
  - **Then** the API validates that the registration number is not empty, persists the record, and returns HTTP 201 Created with the vehicle ID.
- **Scenario 2.2: Fetch Active Fleet**
  - **When** `GET /api/vehicles` is called
  - **Then** the API returns HTTP 200 with an array of vehicles ordered by status and registration number.

---

### User Story 3: Corporate Client CRM & Contracts
> **As an** accounts manager  
> **I want to** manage corporate clients with their GSTIN, addresses, and contract reference numbers  
> **So that** tax invoices automatically associate with the client contract terms and GST compliance.

#### Acceptance Scenarios
- **Scenario 3.1: Client Creation & Validation**
  - **Given** client details with Name, Company Name, valid Indian GSTIN (15 chars), and Contract Reference
  - **When** `POST /api/clients` is called
  - **Then** the API stores the client in Supabase PostgreSQL and returns HTTP 201 Created.

---

### User Story 4: Daily Duty Slip Logging & Run Calculations
> **As a** dispatcher  
> **I want to** log daily vehicle duty slips with odometer start/end readings and run times  
> **So that** total KM, run hours, overtime, tolls, parking, night halt charges, and driver batta are automatically calculated and recorded for billing.

#### Acceptance Scenarios
- **Scenario 4.1: Trip Reading Calculation**
  - **Given** start KM: 10,200, end KM: 10,350, start time: "08:00", end time: "18:30"
  - **When** `POST /api/dutyslips` is submitted
  - **Then** the backend calculates:
    - Total KM = 150
    - Total Hours = 10.5
    - Extra Hours = max(0, 10.5 - 10.0) = 0.5
  - **And** sets status to `Pending` and stores the record in Supabase.
- **Scenario 4.2: Query Unbilled Duty Slips**
  - **Given** client `client-001` and vehicle `veh-001`
  - **When** `GET /api/dutyslips/unbilled?clientId=client-001&vehicleId=veh-001` is called
  - **Then** the API returns only pending duty slips eligible for aggregation into a new invoice.

---

### User Story 5: Monthly Invoicing & Financial Aggregator
> **As a** billing accountant  
> **I want to** generate monthly client invoices supporting Duty Slip Aggregation, Monthly Fixed Packages, and Custom Line Items with Indian GST (CGST/SGST/IGST), TDS, and Advances  
> **So that** legal, audit-compliant invoices are generated with zero manual math errors.

#### Acceptance Scenarios
- **Scenario 5.1: Duty Slip Aggregation Billing**
  - **Given** 3 unbilled duty slips selected for Client `client-001`
  - **When** `POST /api/invoices` is submitted with `attachedDutySlipIds`
  - **Then** the API computes subtotal, applies tax rate (e.g. 5% GST = 2.5% CGST + 2.5% SGST or 5% IGST if interstate), subtracts advance received, applies TDS, generates Indian numbering words (e.g. "Rupees ... Only")
  - **And** automatically marks the attached duty slips as `Billed` with the foreign key `invoiceId`.

---

### User Story 6: Health Checks & Render Cloud Deployment
> **As a** DevOps engineer  
> **I want** the backend containerized with Docker and providing a `/health` endpoint  
> **So that** Render can deploy the web service with zero downtime, auto-restart on failure, and pass health probes.

#### Acceptance Scenarios
- **Scenario 6.1: Health Probe**
  - **When** Render issues `GET /health`
  - **Then** the service returns HTTP 200 with status `"Healthy"`, database connectivity status, and server timestamp.

---

### User Story 7: Frontend Integration & Hybrid State Resilience
> **As a** user in an unstable network environment  
> **I want** the React frontend to communicate with the .NET backend API with local cache fallback  
> **So that** I can continue working seamlessly even if offline, and sync to the cloud when online.

#### Acceptance Scenarios
- **Scenario 7.1: Online Mode**
  - **Given** the .NET backend is accessible
  - **When** the app loads
  - **Then** the frontend fetches fresh data from the API and displays an active "Cloud Connected" badge.
- **Scenario 7.2: Offline / API Fallback**
  - **Given** network disconnection or API unavailability
  - **When** operations are performed
  - **Then** the frontend falls back gracefully to LocalStorage without throwing unhandled exceptions.

---

## 3. Non-Functional Requirements (NFR)
- **Database Engine:** PostgreSQL 15+ (Supabase hosted) via Npgsql Entity Framework Core.
- **Data Integrity:** Strict foreign key constraints and decimal(18,2) precision for all monetary values.
- **Performance:** P95 response time < 80ms for CRUD operations.
- **Security:** Strict CORS configured for frontend domain, parameter sanitization via EF Core, no plain credentials committed to source.


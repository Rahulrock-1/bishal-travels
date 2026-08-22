# Implementation Tasks: BISHAL TRAVELS Invoicing System

## Phase 1: Project Setup & Foundation
- [x] T01: Initialize Vite React TypeScript project with Tailwind CSS & Lucide Icons
- [x] T02: Configure tsconfig, postcss, and Tailwind theme tailored for travel invoicing
- [x] T03: Define core TypeScript types (`CompanyProfile`, `Vehicle`, `Client`, `DutySlip`, `Invoice`, `InvoiceItem`)

## Phase 2: Core State & Utilities
- [x] T04: Implement formatters (Currency INR, Dates, Indian Number-to-Words converter)
- [x] T05: Implement financial calculation helpers (KM run, night charges, parking, GST, TDS, advance)
- [x] T06: Implement storage service (LocalStorage/IndexedDB with auto-sync and JSON backup/restore)
- [x] T07: Create sample preloaded data for BISHAL TRAVELS for immediate out-of-the-box experience
- [x] T08: Implement Global AppContext with CRUD operations for all entities

## Phase 3: Company Profile & First-Time Setup
- [x] T09: Build Company Profile / First-Time Setup Modal (Bank A/C, IFSC, Trade License, GSTIN, Signature)
- [x] T10: Add auto-prompt for first-time users to configure bank & business details

## Phase 4: Fleet & Client Management
- [x] T11: Build Vehicle Management (List, Add/Edit modal, vehicle types, base rates, driver info)
- [x] T12: Build Client Management (List, Add/Edit modal, contract reference numbers, billing terms)

## Phase 5: Duty Slip & Car Run Log Sheet
- [x] T13: Build Daily Duty Slip entry form (Starting/Closing KM, Opening/Closing Time, Night Charges, Parking/Toll, Driver Batta)
- [x] T14: Build Duty Slip table with vehicle & date range filtering, auto-totaling, and status indicators

## Phase 6: Monthly Invoice Generator & Calculator
- [x] T15: Build Invoice Creation Wizard (Client selection, month/year selector, auto-aggregation from duty slips or manual package)
- [x] T16: Implement dynamic billing calculator (Base package, extra KM, extra hours, night halt, parking/toll, GST toggle, advance & TDS)
- [x] T17: Auto-populate Bank details, IFSC, Trade License, Contract No, and Amount in Words

## Phase 7: Pixel-Perfect PDF Export & Print Engine
- [x] T18: Design professional BISHAL TRAVELS Tax Invoice template (Print & PDF ready)
- [x] T19: Design Duty Slip / Car Run Log Annexure template for attached trip itemization
- [x] T20: Implement client-side PDF download engine with jsPDF + html2canvas and direct browser print

## Phase 8: Dashboard, Reports & Polish
- [x] T21: Build Executive Dashboard (Monthly revenue, pending amounts, active vehicles, total KM run)
- [x] T22: Build Monthly Statement & Vehicle Performance Report with CSV/PDF export
- [x] T23: Add Backup / Restore Data functionality and settings export
- [x] T24: Test and polish UI responsiveness on mobile, tablet, and desktop

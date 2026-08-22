# Implementation Plan: BISHAL TRAVELS Invoicing & Fleet Billing System

**Feature Branch**: `001-bishal-travels-invoice`
**Created**: 2026-08-22
**Status**: In Progress
**Spec**: [spec.md](file:///D:/Invoice%20System/specs/001-bishal-travels-invoice/spec.md)

## 1. Technical Architecture & Tech Stack

### Frontend & App Framework
- **Framework**: React 18 / 19 with TypeScript, powered by **Vite** for fast HMR and optimized production builds.
- **Styling**: **Tailwind CSS** with custom emerald/amber/slate travel-themed color palette, responsive typography, polished card surfaces, badge states, and dedicated print stylesheets (`@media print`).
- **Icons**: **Lucide React** for modern UI icons.
- **Date Handling**: **date-fns** for date manipulation, month picker, formatting.
- **PDF Generation**: Native browser print stylesheet optimization + **jsPDF** & **html2canvas** / **jspdf-autotable** client-side engine with pixel-perfect vector table generation, A4 sizing, auto-pagination, embedded bank details, QR codes, and watermarking.
- **Storage Layer**: LocalStorage + IndexedDB with reactive React State hooks and complete JSON Backup & Restore mechanism.
- **Number to Words**: Dedicated Indian Currency Number-to-Words converter supporting Lakhs, Crores, and Paise.

### Project Directory Structure
```
D:/Invoice System/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts                 # Company, Vehicle, DutySlip, Client, Invoice interfaces
│   ├── context/
│   │   └── AppContext.tsx           # Global state manager, persistence, sample data
│   ├── utils/
│   │   ├── formatters.ts            # Currency (INR), date formatting, number to words
│   │   ├── calculations.ts          # Run KM, Night charge, Parking, Tax & Total math
│   │   ├── pdfGenerator.ts          # High quality PDF export engine (jsPDF & html2canvas)
│   │   └── storage.ts               # Storage adapters & backup/restore helpers
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── common/
│   │   │   ├── Modal.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ConfirmDialog.tsx
│   │   ├── settings/
│   │   │   ├── SettingsModal.tsx    # First-time setup & Bank/Trade License configuration
│   │   │   └── CompanyProfileForm.tsx
│   │   ├── vehicles/
│   │   │   ├── VehicleList.tsx
│   │   │   └── VehicleModal.tsx
│   │   ├── clients/
│   │   │   ├── ClientList.tsx
│   │   │   └── ClientModal.tsx
│   │   ├── dutyslips/
│   │   │   ├── DutySlipList.tsx     # Car run entries, Night charges, Parking, Tolls
│   │   │   └── DutySlipModal.tsx
│   │   ├── invoices/
│   │   │   ├── InvoiceGenerator.tsx # Step-by-step invoice creator & calculator
│   │   │   ├── InvoiceList.tsx      # Filter, search, status tracking
│   │   │   ├── InvoiceViewModal.tsx # Full invoice viewer with print/download
│   │   │   ├── InvoicePrintTemplate.tsx # Standard travel invoice print design
│   │   │   └── DutyAnnexurePrintTemplate.tsx # Daily run log annexure print design
│   │   ├── reports/
│   │   │   ├── MonthlyReportView.tsx# Vehicle-wise and Client-wise monthly statements
│   │   │   └── ExportReportModal.tsx
│   │   └── dashboard/
│   │       ├── DashboardOverview.tsx# Revenue stats, active cars, recent invoices
│   │       └── QuickActions.tsx
│   └── data/
│       └── sampleData.ts            # Preloaded demo vehicles, trips, and client data for BISHAL TRAVELS
```

## 2. Key Modules & Implementation Steps

1. **Scaffold & Dependencies**: Configure Vite, React, TypeScript, Tailwind CSS, Lucide icons, jsPDF, html2canvas, date-fns.
2. **Type System & Storage Engine**: Define strict TypeScript interfaces and robust LocalStorage persistence with initial BISHAL TRAVELS defaults (Bank Name: State Bank of India / HDFC, A/C No, IFSC Code, Trade License, GSTIN, Kolkata/Siliguri address).
3. **Settings & First-Time Setup**: Interactive setup modal allowing the user to configure and update company details, bank account, IFSC code, branch, trade license, contract numbers, and signatory.
4. **Vehicles & Client CRM**: Full CRUD for fleet vehicles (Reg No, Model, Type, Driver, Base Rates) and corporate/individual clients (Contract Ref, GSTIN, Address).
5. **Daily Duty Slip / Car Run Tracker**: Interactive log sheet to record daily trips (Starting KM, Closing KM, Night Halt, Parking Charges, Toll, Driver Batta, Route/Duty).
6. **Monthly Invoice Generator**:
   - Multi-mode calculation (Aggregated Duty Slips, Monthly Fixed Package + Extra KM/Hr, or Custom Line Items).
   - Real-time computation of Run KMs, Night charges, Parking/Toll, Driver charges, Discounts, GST (CGST+SGST/IGST), Advance received, and TDS.
   - Auto Number to Indian Words conversion.
   - Instant invoice creation with auto-populated bank and trade license snapshots.
7. **High-Res PDF Export & Print**:
   - Pixel-perfect Tax Invoice template matching Indian travel industry standards.
   - Separate or bundled Daily Duty Sheet Annexure showing every trip, opening/closing KM, night stay, and parking bill.
   - Download PDF button (vector PDF) and Native Browser Print button.
8. **Dashboard & Monthly Reports**: Interactive overview with revenue analytics, vehicle utilization charts, and exportable monthly summaries.
9. **Polishing & Responsiveness**: Mobile navigation drawer, keyboard shortcuts, toasts, notifications, data export/import, and UI beauty.

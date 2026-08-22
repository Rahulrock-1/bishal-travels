# 🚖 BISHAL TRAVELS - Monthly Travel Invoice & Fleet Management System

A modern, responsive, and scalable web application built specifically for **BISHAL TRAVELS** to manage vehicle fleets, track daily car run logs (duty slips), manage corporate client contracts, and generate professional, print-ready, and downloadable monthly PDF invoices with auto-populated bank and legal details.

---

## ✨ Key Features

### 1. 🏦 Bank & Business Profile Auto-Population
- **First-Time Setup**: Enter your business details (BISHAL TRAVELS), Trade License Number, GSTIN, PAN, and Bank Details (Bank Name, Account Holder, Account Number, IFSC Code, Branch, UPI ID).
- **Auto-Population**: All saved credentials automatically stamp onto every new invoice, duty slip annexure, and downloadable PDF with zero redundant typing.
- **Easy Updates**: Change bank accounts or contact details at any time from the **Bank & Profile** settings modal.

### 2. 🚗 Fleet & Car Run Tracking (Duty Slips)
- **Vehicle Management**: Register cars with Registration Number (e.g. `WB 02 AL 4589`), Model (Dzire, Innova Crysta, Scorpio, Ertiga, etc.), Vehicle Category, Fuel Type, and Assigned Driver.
- **Daily Duty Log Sheet**:
  - Record Starting KM & Closing KM $\rightarrow$ **Automatically calculates Total Run KM**.
  - Record Opening Time & Closing Time $\rightarrow$ **Automatically calculates Total Hours & Overtime**.
  - Log **Night Halt Charges (₹)**, **Parking Charges (₹)**, **Toll Taxes (₹)**, and **Driver Batta (₹)**.
  - Export duty records directly as CSV or link them to monthly client invoices.

### 3. 🧾 Monthly Invoice Generator & Financial Calculator
- **Flexible Billing Models**:
  - **Auto-Aggregate from Duty Slips**: Pulls all unbilled trips for a vehicle and client, instantly summing total KM, night halts, parking fees, and driver allowances.
  - **Monthly Package Billing**: Base monthly package (e.g. 2,500 KM / 250 Hrs) + Extra KM rate + Extra Hour rate + actual surcharges.
  - **Custom Line Item Billing**: Add custom duty entries or outstation charges.
- **Taxes & Deductions**:
  - GST 5% (Travel Standard), GST 12%, GST 18%, or Non-GST toggle.
  - Interstate (IGST) or Intrastate (CGST + SGST) automatic calculation.
  - Advance Received deductions and TDS (e.g. 1% or 2%) withholding.
- **Amount in Words**: Converts net payable total to Indian numbering format (e.g. *"Rupees Forty-Three Thousand Four Hundred and Twenty Only"*).

### 4. 📄 Pixel-Perfect PDF Export & Print Engine
- **Tax Invoice PDF**: Crisp, high-resolution vector PDF export designed according to Indian transport billing standards with BISHAL TRAVELS header, Trade License, GSTIN/PAN, Bill-To block, itemized table, Bank Details box, and Authorized Signatory.
- **Duty Slip Annexure**: Automatic attached trip-by-trip log annexure with starting/closing odometer readings and timings for corporate audit approval.
- **Single-Click Download**: Instant client-side PDF download or direct browser print.

### 5. 📊 Reports & Data Backup
- **Monthly Statements**: Vehicle-wise run & revenue performance and client billing statements.
- **Data Safety**: Offline-first LocalStorage persistence with **JSON Backup Export & Restore** so your data is always safe and exportable.

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- `npm`

### Installation & Launch

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📂 Project Architecture

```
D:/Invoice System/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts                 # Type definitions
│   ├── context/
│   │   └── AppContext.tsx           # Global state & LocalStorage sync
│   ├── utils/
│   │   ├── formatters.ts            # Currency (INR), dates, Indian number-to-words
│   │   ├── calculations.ts          # KM, hours, taxes, invoice totals
│   │   ├── pdfGenerator.ts          # jsPDF & html2canvas PDF export
│   │   └── storage.ts               # LocalStorage & JSON backup/restore
│   ├── data/
│   │   └── sampleData.ts            # Preloaded BISHAL TRAVELS demo data
│   └── components/
│       ├── layout/                  # Navbar & responsive layout
│       ├── common/                  # Modal, Badge, StatCard
│       ├── settings/                # Bank & Business Profile Setup Modal
│       ├── vehicles/                # Fleet & Car Management
│       ├── clients/                 # Corporate Client CRM
│       ├── dutyslips/               # Daily Duty Slips & Run Logs
│       ├── invoices/                # Generator, Viewer, Print & PDF Templates
│       ├── reports/                 # Monthly Performance Statements
│       └── dashboard/               # Executive KPIs & Quick Actions
```

---

## 🔒 Security & Privacy
All client data, vehicle logs, and bank details are securely stored locally within the user's browser, giving full privacy and zero reliance on external third-party servers.

# Feature Specification: BISHAL TRAVELS Monthly Invoice & Fleet Billing System

**Feature Branch**: `001-bishal-travels-invoice`
**Created**: 2026-08-22
**Status**: Ready for Implementation
**Input**: "i want to make a website for BISHAl TRAVELS where user can generate monthly invoice according to there car how much run night charges parking charges what ever required one more fiture uuser can download those report in pdf format bank details first time user can add then that bank account ifsce code contract details trade licsense numer auto populate pdf make proper design and scalable site"

## Overview
A dedicated, responsive, scalable web application tailored for **BISHAL TRAVELS** to manage vehicle fleets, daily travel logs (duty slips), client contracts, monthly distance & hours billing, extra charges (night charges, parking, toll, driver batta), bank accounts, trade license numbers, and generate professional, downloadable PDF invoices and duty annexure reports.

## User Scenarios & Testing

### User Story 1 - First-Time Company & Bank Profile Setup (Priority: P1)
As the owner/manager of BISHAL TRAVELS, I want to configure my business profile once—including Company Name, Trade License Number, GSTIN/PAN, Bank Name, Account Number, IFSC Code, Branch, Contract Details, and contact details—so that all future invoices and PDF reports automatically populate with these official credentials without having to re-type them.

**Why this priority**: Essential foundation for professional legal invoicing and payment collection.

**Acceptance Scenarios**:
1. **Given** a new user visits the site, **When** they open Settings / First-Time Setup modal, **Then** they can save Business Name, Trade License, GSTIN, Bank details (A/C No, IFSC, Bank, Branch), UPI ID, and Signature.
2. **Given** saved business settings, **When** generating any invoice or PDF, **Then** all bank details, trade license, and contract details auto-populate accurately.

---

### User Story 2 - Car & Fleet Management (Priority: P1)
As a fleet manager, I want to add and manage vehicles (Car registration number, model/type e.g. Sedan/SUV/Innova/Dzire, driver name, rate configuration) so I can record run history and bill clients per vehicle or per contract.

**Why this priority**: Core entity needed to calculate car run and charges.

**Acceptance Scenarios**:
1. **Given** the Fleet page, **When** user adds a vehicle with Reg No (e.g. `WB-02-AB-1234`), Model (`Swift Dzire`), Default Driver, and Base/Rate configs, **Then** the car is available for daily trip logs and monthly invoicing.

---

### User Story 3 - Daily Duty Log / Car Run Entry (Priority: P1)
As a travel operator, I want to record daily duty slips or monthly car run logs including Date, Car/Vehicle, Route/Duty description, Starting KM, Closing KM (Total Run calculated automatically), Start/End Time (Hours calculated), Night Halt / Night Charges, Toll & Parking charges, and Driver allowance.

**Why this priority**: Travel agencies bill based on monthly duty sheets and daily trip slips.

**Acceptance Scenarios**:
1. **Given** a vehicle selected, **When** user enters Starting KM: 10,200 and Closing KM: 10,380, Night Charges: ₹350, Parking/Toll: ₹120, **Then** Total KM: 180 KM is calculated instantly and added to the monthly trip pool.
2. **Given** multiple duty entries in a month, **When** viewing the vehicle or client duty sheet, **Then** the aggregate KM, night charges, and parking charges are summed accurately.

---

### User Story 4 - Monthly Invoice Generation & Custom Billing Calculation (Priority: P1)
As an operator, I want to generate a monthly invoice for a selected client and vehicle(s) for any billing month/year, supporting multiple billing models (Fixed monthly package + extra km/hr, or pure per-km/per-day billing + night charges + parking/toll + GST + TDS/Advance deductions).

**Why this priority**: Core revenue-generating feature of the application.

**Acceptance Scenarios**:
1. **Given** a client and billing month (e.g. August 2026), **When** user creates an invoice, **Then** the system aggregates all car run KMs, extra hours, night charges, parking charges, calculates Subtotal, optional GST (CGST+SGST or IGST), deducts advance/TDS, and formats the Total in Rupees and Words.
2. **Given** an invoice is created, **When** viewing the invoice list, **Then** status (Draft, Sent, Paid, Overdue) and actions (View, Edit, Download PDF, Print, Share) are readily accessible.

---

### User Story 5 - Pixel-Perfect Downloadable PDF Invoice & Duty Annexure (Priority: P1)
As a travel agency owner, I want to download a high-resolution, print-ready PDF invoice with official BISHAL TRAVELS branding, Trade License, Bank Account & IFSC details, Contract reference, itemized run charges, and duty log sheet annexure so that clients can review and process payments immediately.

**Why this priority**: Crucial business output required by clients and corporate accounts for payment clearance.

**Acceptance Scenarios**:
1. **Given** any generated invoice, **When** user clicks "Download PDF", **Then** a clean, professional vector-crisp PDF document is downloaded with proper margins, BISHAL TRAVELS header, Bank & IFSC box, Trade License, itemized calculations, and signature block.
2. **Given** an invoice with daily duty slips attached, **When** user downloads the comprehensive report, **Then** both the Tax Invoice page and the Daily Duty Log Sheet Annexure are included.

---

### User Story 6 - Client Management & Contract Tracking (Priority: P2)
As an operator, I want to store corporate and individual client details (Company Name, GSTIN, Address, Contact Person, Phone, Email, Contract Reference No / Agreement Date) so that contract details auto-populate into every invoice.

**Acceptance Scenarios**:
1. **Given** a client profile with Contract Ref `BT-CORP-2026-08`, **When** selecting this client in a new invoice, **Then** the contract details and address auto-fill into the invoice.

---

### User Story 7 - Dashboard Analytics & Reports (Priority: P2)
As the owner, I want a visual dashboard showing total monthly billing, pending payments, total distance run across all cars, active fleet count, and monthly revenue trends.

**Acceptance Scenarios**:
1. **Given** recorded invoices and duty logs, **When** accessing the Dashboard, **Then** key KPI cards (Total Revenue, Outstanding Amount, Total KM Run, Invoices Generated) and charts display current statistics.

## Requirements

### Functional Requirements
- **FR-001**: System MUST provide a First-Time Setup and persistent Settings manager for BISHAL TRAVELS business info: Business Name, Tagline, Address, Phone, Email, Trade License Number, GSTIN, PAN, Bank Name, Account Holder, Account Number, IFSC Code, Branch Name, UPI ID, and Signature text/image.
- **FR-002**: System MUST allow adding, editing, and deleting Vehicles with Vehicle Registration Number, Model, Vehicle Type (Hatchback/Sedan/SUV/Tempo/Bus), Default Driver Name, Owner info, and default rate rules.
- **FR-003**: System MUST record Daily Duty Slips / Car Run entries with Date, Vehicle, Client, Duty description/Route, Opening KM, Closing KM, Total KM, Opening Time, Closing Time, Total Hours, Night Halt Charges, Parking Charges, Toll Charges, Driver Batta, and Remarks.
- **FR-004**: System MUST allow generating monthly invoices by pulling aggregated car run data or custom monthly package rules (Fixed Monthly Rental, Rate per KM, Extra KM rate, Extra Hour rate, Night Halt charges, Parking & Toll charges, Other expenses/discounts).
- **FR-005**: System MUST compute taxes (GST 5%, 12%, 18% or Non-GST toggle; CGST + SGST or IGST) and calculate Advance Received, TDS deduction, and Net Balance Payable.
- **FR-006**: System MUST convert the total net payable amount into Indian Currency Words (e.g. "Rupees Forty-Five Thousand Six Hundred and Twenty Only") automatically.
- **FR-007**: System MUST generate and download high-quality, professional PDF invoices and duty summary reports with one click.
- **FR-008**: System MUST support client-side persistent storage (LocalStorage + IndexedDB) with export/import backup functionality (JSON backup file) and preloaded sample data for immediate test-drive.
- **FR-009**: System MUST provide print styling (`@media print`) and in-browser invoice preview with full pagination, high contrast, and clean borders.
- **FR-010**: System MUST provide search, filtering by client, vehicle, month, and payment status (Draft, Pending, Paid, Cancelled).

### Key Entities
- **CompanyProfile**: `businessName`, `tradeLicenseNo`, `gstin`, `pan`, `address`, `phone`, `email`, `bankName`, `accountHolder`, `accountNumber`, `ifscCode`, `branchName`, `upiId`, `logoUrl`, `signatureText`.
- **Client**: `id`, `name`, `companyName`, `gstin`, `address`, `phone`, `email`, `contractRefNo`, `contractStartDate`, `paymentTerms`.
- **Vehicle**: `id`, `regNumber`, `model`, `type`, `driverName`, `driverPhone`, `defaultRatePerKm`, `defaultNightCharge`, `baseMonthlyRate`.
- **DutySlip (Trip Log)**: `id`, `date`, `vehicleId`, `clientId`, `dutySlipNo`, `route`, `startKm`, `endKm`, `totalKm`, `startTime`, `endTime`, `totalHours`, `nightCharges`, `parkingCharges`, `tollCharges`, `driverBatta`, `otherCharges`, `notes`, `billedInvoiceId`.
- **Invoice**: `id`, `invoiceNumber`, `invoiceDate`, `dueDate`, `billingMonth`, `billingYear`, `clientId`, `vehicleIds`, `items` (Line items: Vehicle Run, Fixed Rental, Extra KM, Extra Hrs, Night Charges, Parking/Toll, Driver Allowance), `subtotal`, `taxRate`, `cgst`, `sgst`, `igst`, `isInterstate`, `discount`, `advanceReceived`, `tdsDeducted`, `totalAmount`, `amountInWords`, `bankDetailsSnapshot`, `tradeLicenseSnapshot`, `contractRefSnapshot`, `status`, `notes`, `terms`.

## Success Criteria
- **SC-001**: User can set up bank and trade license details once and have them auto-populated on 100% of new invoices and PDF downloads.
- **SC-002**: Monthly car run, night charges, parking, and toll calculations compute in real-time with zero manual math errors.
- **SC-003**: PDF generation and download completes in under 2 seconds directly in the client browser with crisp vector rendering.
- **SC-004**: Responsive design functions flawlessly across mobile, tablet, and desktop viewports.

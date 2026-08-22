# BISHAL TRAVELS Invoicing System Constitution

## Core Principles

### I. Accurate Financial & Travel Operations Calculations
All calculations for distance (Starting KM / Closing KM / Total Run), hours, overtime, night halt charges, toll/parking charges, driver allowances, discounts, and GST (CGST/SGST/IGST) must be deterministic, transparent, mathematically verified, and formatted according to Indian numbering and currency standards (INR ₹).

### II. Seamless First-Time Setup & Auto-Population
Company details (BISHAL TRAVELS), bank accounts (Account No, IFSC, Bank Name, Branch), trade license number, contract/vendor agreement numbers, and tax identifiers (GSTIN/PAN) must be configured once and automatically populated across all new invoices, daily duty logs, and PDF exports with zero redundant data entry.

### III. Pixel-Perfect, Print-Ready & Downloadable PDF Generation
Generated invoices and duty reports must render with professional typography, clean tables, formal headers, client bill-to blocks, itemized breakdowns, bank details, terms, and signature authorizations. Output PDFs must be downloadable instantly and formatted for standard A4 printing.

### IV. Offline-First, Resilient & Scalable Data Architecture
User data, vehicles, duty logs, clients, and invoice histories must be stored reliably on the client side (LocalStorage / IndexedDB) with full export/import capabilities (JSON backup & restore), allowing uninterrupted operation without requiring complex external database servers while remaining easily connectable to backend APIs in the future.

### V. Intuitive, Responsive & Modern UI/UX
The application must provide a responsive, elegant interface suitable for desktop, tablet, and mobile screens. Operations like adding a daily log, generating a monthly invoice, filtering by vehicle or client, and downloading reports must take fewer than 3 clicks.

## Governance
- All invoice calculations must round currency values to 2 decimal places and support conversion to Words in Indian numbering format (e.g. Rupees Fifty Thousand Only).
- State and data schemas must be strictly typed via TypeScript.
- Changes to calculation logic or invoice templates must maintain backwards compatibility with existing stored invoices.

**Version**: 1.0.0 | **Ratified**: 2026-08-22

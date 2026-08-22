export type VehicleType = 
  | 'Sedan'
  | 'SUV'
  | 'Innova Crysta'
  | 'Hatchback'
  | 'Tempo Traveller'
  | 'Bus'
  | 'Luxury'
  | 'Commercial Cab';

export type FuelType = 'Diesel' | 'Petrol' | 'CNG' | 'Electric';

export interface CompanyProfile {
  businessName: string;
  tagline: string;
  tradeLicenseNo: string;
  gstin: string;
  pan: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  upiId: string;
  signatoryName: string;
  signatoryTitle: string;
  logoUrl?: string;
  defaultTerms: string[];
  isConfigured: boolean;
}

export interface Vehicle {
  id: string;
  regNumber: string;
  model: string;
  type: VehicleType;
  fuelType: FuelType;
  driverName: string;
  driverPhone: string;
  baseMonthlyRate: number;
  ratePerKm: number;
  ratePerHour: number;
  nightChargeRate: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  companyName: string;
  gstin: string;
  pan?: string;
  address: string;
  phone: string;
  email: string;
  contractRefNo: string;
  contractStartDate?: string;
  contractEndDate?: string;
  paymentTermsDays: number;
  notes?: string;
}

export interface DutySlip {
  id: string;
  dutySlipNo: string;
  date: string; // YYYY-MM-DD
  vehicleId: string;
  clientId: string;
  route: string;
  driverName: string;
  startKm: number;
  endKm: number;
  totalKm: number;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  totalHours: number;
  extraHours: number;
  nightCharges: number;
  parkingCharges: number;
  tollCharges: number;
  driverBatta: number;
  fuelCharges: number;
  otherExpenses: number;
  notes?: string;
  invoiceId?: string; // Linked invoice ID when billed
  status: 'Pending' | 'Billed';
}

export interface InvoiceItem {
  id: string;
  description: string;
  vehicleRegNo?: string;
  vehicleModel?: string;
  billingType: 'DutySlipAggregated' | 'MonthlyPackage' | 'PerKm' | 'Custom';
  basePackageAmount: number;
  totalRunKm: number;
  ratePerKm: number;
  kmCharges: number;
  extraKm: number;
  extraKmRate: number;
  extraKmCharges: number;
  extraHours: number;
  extraHourRate: number;
  extraHourCharges: number;
  nightCharges: number;
  parkingCharges: number;
  tollCharges: number;
  driverAllowance: number;
  otherCharges: number;
  amount: number;
}

export type TaxType = 'GST_5' | 'GST_12' | 'GST_18' | 'GST_28' | 'NON_GST';
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  billingMonth: string; // "August 2026" or "2026-08"
  clientId: string;
  clientSnapshot: Client;
  contractRefNo: string;
  items: InvoiceItem[];
  attachedDutySlipIds: string[];
  subtotal: number;
  taxType: TaxType;
  taxRate: number; // e.g. 5, 12, 18, 0
  cgst: number;
  sgst: number;
  igst: number;
  isInterstate: boolean;
  discount: number;
  advanceReceived: number;
  tdsRate: number; // e.g. 1% or 2%
  tdsAmount: number;
  grandTotal: number;
  netPayable: number;
  amountInWords: string;
  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    ifscCode: string;
    branchName: string;
    upiId: string;
  };
  tradeLicenseNo: string;
  companyGstin: string;
  companyPan: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  status: InvoiceStatus;
  notes: string;
  terms: string[];
  createdAt: string;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'invoices' 
  | 'create-invoice' 
  | 'duty-slips' 
  | 'vehicles' 
  | 'clients' 
  | 'reports' 
  | 'settings';

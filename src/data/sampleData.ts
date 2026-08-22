import { CompanyProfile, Vehicle, Client, DutySlip, Invoice } from '../types';
import { numberToWordsIndian } from '../utils/formatters';

export const initialCompanyProfile: CompanyProfile = {
  businessName: 'BISHAL TRAVELS',
  tagline: 'Car Rental & Commercial Fleet Operations',
  tradeLicenseNo: '1711',
  vendorId: '10482',
  gstin: '',
  pan: 'BQNPP4333F',
  address: 'VILL - KALMIKHALI, P.O - ANDHARMANIK, P.S - BISHNUPUR, DIST - SOUTH 24 PARGANAS, PIN - 743503, STATE - WEST BENGAL',
  phone: '9088933712',
  email: 'bishaltravels.kolkata@gmail.com',
  bankName: 'STATE BANK OF INDIA',
  accountHolder: 'BISHAL TRAVELS',
  accountNumber: '44982066411',
  ifscCode: 'SBIN0002117',
  branchName: 'Bishnupur Branch, South 24 Parganas',
  upiId: '9088933712@sbi',
  signatoryName: 'Bishal',
  signatoryTitle: 'Proprietor / Authorized Signatory',
  defaultTerms: [
    'Payment must be cleared within 15 days from the date of invoice submission.',
    'Parking and toll charges are billed as per actuals.',
    'Night charges applicable for duties beyond normal operating hours.'
  ],
  isConfigured: true,
};

export const sampleVehicles: Vehicle[] = [
  {
    id: 'veh-1',
    regNumber: 'WB19R4841',
    model: 'Maruti Suzuki Swift Dzire (Commercial)',
    type: 'Sedan',
    fuelType: 'Diesel',
    driverName: 'Ramesh Das',
    driverPhone: '9088933712',
    defaultDailyKm: 100,
    defaultDailyHours: 10,
    baseMonthlyRate: 40000,
    ratePerKm: 18,
    ratePerHour: 90,
    nightChargeRate: 350,
    status: 'Active',
    notes: 'Primary monthly corporate vehicle'
  },
  {
    id: 'veh-2',
    regNumber: 'WB02AL4589',
    model: 'Toyota Innova Crysta',
    type: 'Innova Crysta',
    fuelType: 'Diesel',
    driverName: 'Subhasish Roy',
    driverPhone: '9832044556',
    defaultDailyKm: 120,
    defaultDailyHours: 12,
    baseMonthlyRate: 65000,
    ratePerKm: 24,
    ratePerHour: 150,
    nightChargeRate: 500,
    status: 'Active',
    notes: 'Outstation and VIP Duties'
  },
  {
    id: 'veh-3',
    regNumber: 'WB06H8821',
    model: 'Maruti Suzuki Ertiga',
    type: 'SUV',
    fuelType: 'CNG',
    driverName: 'Anup Mondal',
    driverPhone: '9748033211',
    defaultDailyKm: 100,
    defaultDailyHours: 10,
    baseMonthlyRate: 45000,
    ratePerKm: 16,
    ratePerHour: 120,
    nightChargeRate: 400,
    status: 'Active',
    notes: 'Monthly corporate duty'
  }
];

export const sampleClients: Client[] = [
  {
    id: 'client-1',
    name: 'Logistics Manager',
    companyName: 'Eastern Infrastructure Projects Ltd.',
    gstin: '',
    pan: '',
    address: 'Sector V, Salt Lake, Kolkata - 700091',
    phone: '9830012345',
    email: 'billing@easterninfra.in',
    contractRefNo: 'EIPL/TRAN/2026/044',
    contractStartDate: '2026-07-01',
    paymentTermsDays: 15,
    notes: 'Monthly dedicated vehicle contract'
  }
];

export const sampleDutySlips: DutySlip[] = [];
export const sampleInvoices: Invoice[] = [];

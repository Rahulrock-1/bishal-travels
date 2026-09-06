import { DutySlip, InvoiceItem, TaxType } from '../types';

/**
 * Calculates duty slip totals
 */
export function calculateDutySlipMetrics(data: {
  startKm: number;
  endKm: number;
  startTime: string;
  endTime: string;
  baseDutyHours?: number;
}): { totalKm: number; totalHours: number; extraHours: number } {
  const startKm = Number(data.startKm) || 0;
  const endKm = Number(data.endKm) || 0;
  const totalKm = Math.max(0, endKm - startKm);

  let totalHours = 0;
  let extraHours = 0;
  const baseDutyHours = data.baseDutyHours || 8; // standard 8 or 10 hours

  if (data.startTime && data.endTime) {
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);

    if (!isNaN(startH) && !isNaN(startM) && !isNaN(endH) && !isNaN(endM)) {
      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;

      // Handle overnight wrap-around (e.g. 22:00 to 06:00)
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }

      const diffMinutes = endMinutes - startMinutes;
      totalHours = Math.round((diffMinutes / 60) * 10) / 10;
      extraHours = Math.max(0, Math.round((totalHours - baseDutyHours) * 10) / 10);
    }
  }

  return {
    totalKm,
    totalHours,
    extraHours,
  };
}

/**
 * Calculates Line Item Amount
 */
export function calculateInvoiceItemAmount(item: Partial<InvoiceItem>): number {
  const base = Number(item.basePackageAmount) || 0;
  const kmCharges = Number(item.kmCharges) || 0;
  const extraKmCharges = (Number(item.extraKm) || 0) * (Number(item.extraKmRate) || 0);
  const extraHourCharges = (Number(item.extraHours) || 0) * (Number(item.extraHourRate) || 0);
  const nightCharges = Number(item.nightCharges) || 0;
  const parkingCharges = Number(item.parkingCharges) || 0;
  const tollCharges = Number(item.tollCharges) || 0;
  const driverAllowance = Number(item.driverAllowance) || 0;
  const otherCharges = Number(item.otherCharges) || 0;

  return Math.round((base + kmCharges + extraKmCharges + extraHourCharges + nightCharges + parkingCharges + tollCharges + driverAllowance + otherCharges) * 100) / 100;
}

/**
 * Calculates complete invoice totals
 */
export function calculateInvoiceTotals(params: {
  items: InvoiceItem[];
  taxType: TaxType;
  isInterstate: boolean;
  discount: number;
  advanceReceived: number;
  tdsRate: number;
}): {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  tdsAmount: number;
  grandTotal: number;
  netPayable: number;
} {
  const subtotal = params.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Number(params.discount) || 0));
  const taxableAmount = Math.max(0, subtotal - discountAmount);

  let taxRate = 0;
  if (params.taxType === 'GST_5') taxRate = 5;
  else if (params.taxType === 'GST_12') taxRate = 12;
  else if (params.taxType === 'GST_18') taxRate = 18;
  else if (params.taxType === 'GST_28') taxRate = 28;

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (taxRate > 0) {
    const totalTax = (taxableAmount * taxRate) / 100;
    if (params.isInterstate) {
      igst = Math.round(totalTax * 100) / 100;
    } else {
      cgst = Math.round((totalTax / 2) * 100) / 100;
      sgst = Math.round((totalTax / 2) * 100) / 100;
    }
  }

  const grandTotal = Math.round((taxableAmount + cgst + sgst + igst) * 100) / 100;

  // TDS is applied on taxable amount / gross
  const tdsRate = Math.max(0, Number(params.tdsRate) || 0);
  const tdsAmount = Math.round(((taxableAmount * tdsRate) / 100) * 100) / 100;

  const advanceReceived = Math.max(0, Number(params.advanceReceived) || 0);
  const netPayable = Math.max(0, Math.round((grandTotal - advanceReceived - tdsAmount) * 100) / 100);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    taxRate,
    cgst,
    sgst,
    igst,
    tdsAmount,
    grandTotal,
    netPayable,
  };
}

/**
 * Generate next sequential invoice number (e.g. BT/2026-27/001)
 */
export function generateNextInvoiceNumber(existingCount: number, prefix: string = 'BT'): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  
  // Indian Financial Year calculation (starts in April)
  let fyStart = currentYear;
  let fyEnd = (currentYear + 1) % 100;
  if (currentMonth < 4) {
    fyStart = currentYear - 1;
    fyEnd = currentYear % 100;
  }
  const fyStr = `${fyStart}-${String(fyEnd).padStart(2, '0')}`;
  const seq = String(existingCount + 1).padStart(3, '0');
  
  return `${prefix}/${fyStr}/${seq}`;
}

/**
 * Mode 1: Base Package + Highest Extra (KM vs OT) - Previous Logic
 */
export function computeRowTotalHighestExtra(params: {
  km: number;
  totalHours: number;
  extraHours?: number;
  nightCharges: number;
  parkingCharges: number;
  tollCharges: number;
  driverBatta: number;
  ratePerKm: number;
  overtimeRatePerHour: number;
  baseDutyHours: number;
  baseDutyKm: number;
  garageKm?: number;
  garageRatePerKm?: number;
  extraDutyCharges?: number;
}): number {
  const {
    km = 0,
    totalHours = 0,
    extraHours,
    nightCharges = 0,
    parkingCharges = 0,
    tollCharges = 0,
    driverBatta = 0,
    extraDutyCharges = 0,
    ratePerKm = 0,
    overtimeRatePerHour = 0,
    baseDutyHours = 10,
    baseDutyKm = 100,
    garageKm = 0,
    garageRatePerKm = 0,
  } = params;

  if (km === 0 && totalHours === 0 && (Number(garageKm) || 0) === 0) {
    return (Number(nightCharges) || 0) + (Number(parkingCharges) || 0) + (Number(tollCharges) || 0) + (Number(driverBatta) || 0) + (Number(extraDutyCharges) || 0);
  }

  const basePackageAmount = (km > 0 || totalHours > 0) ? baseDutyKm * ratePerKm : 0;
  const extraKm = Math.max(0, km - baseDutyKm);
  const extraKmCost = extraKm * ratePerKm;

  const otHrs = extraHours !== undefined ? Number(extraHours) : Math.max(0, totalHours - baseDutyHours);
  const extraHourCost = otHrs * overtimeRatePerHour;

  const highestExtraCost = Math.max(extraKmCost, extraHourCost);
  const garageCost = (Number(garageKm) || 0) * (garageRatePerKm || ratePerKm);

  return Math.round(
    (basePackageAmount + highestExtraCost + garageCost + (Number(nightCharges) || 0) + (Number(parkingCharges) || 0) + (Number(tollCharges) || 0) + (Number(driverBatta) || 0) + (Number(extraDutyCharges) || 0)) * 100
  ) / 100;
}

/**
 * Mode 2: Dual Calculate - Both KM & Overtime Calculated Together - New Separated Logic
 */
export function computeRowTotalBothKmAndOt(params: {
  km: number;
  totalHours: number;
  extraHours?: number;
  nightCharges: number;
  parkingCharges: number;
  tollCharges: number;
  driverBatta: number;
  extraDutyCharges?: number;
  ratePerKm: number;
  overtimeRatePerHour: number;
  baseDutyHours?: number;
  baseDutyKm?: number;
  garageKm?: number;
  garageRatePerKm?: number;
  useBasePackage?: boolean;
}): number {
  const {
    km = 0,
    totalHours = 0,
    extraHours,
    nightCharges = 0,
    parkingCharges = 0,
    tollCharges = 0,
    driverBatta = 0,
    extraDutyCharges = 0,
    ratePerKm = 0,
    overtimeRatePerHour = 0,
    baseDutyHours = 10,
    baseDutyKm = 100,
    garageKm = 0,
    garageRatePerKm = 0,
    useBasePackage = false,
  } = params;

  if (km === 0 && totalHours === 0 && (Number(garageKm) || 0) === 0) {
    return (Number(nightCharges) || 0) + (Number(parkingCharges) || 0) + (Number(tollCharges) || 0) + (Number(driverBatta) || 0) + (Number(extraDutyCharges) || 0);
  }

  // KM charges: if base package configured, base + extra km; otherwise direct run * rate
  let kmCharge = 0;
  if (useBasePackage && baseDutyKm > 0) {
    const baseAmt = baseDutyKm * ratePerKm;
    const extraKm = Math.max(0, km - baseDutyKm);
    kmCharge = baseAmt + (extraKm * ratePerKm);
  } else {
    kmCharge = km * ratePerKm;
  }

  // Overtime charges: directly from editable extraHours, or derived from total hours
  const otHrs = extraHours !== undefined ? Number(extraHours) : Math.max(0, totalHours - (baseDutyHours || 10));
  const otCharge = otHrs * overtimeRatePerHour;

  // Garage run charges
  const garageCost = (Number(garageKm) || 0) * (garageRatePerKm || ratePerKm);

  // Extras
  const surcharges = (Number(nightCharges) || 0) + (Number(parkingCharges) || 0) + (Number(tollCharges) || 0) + (Number(driverBatta) || 0) + (Number(extraDutyCharges) || 0);

  return Math.round((kmCharge + otCharge + garageCost + surcharges) * 100) / 100;
}

export interface BillingBreakupSummary {
  totalKm: number;
  ratePerKm: number;
  kmTotalAmount: number;
  totalOvertimeHours: number;
  overtimeRatePerHour: number;
  overtimeTotalAmount: number;
  totalGarageKm: number;
  garageRatePerKm: number;
  garageTotalAmount: number;
  totalNightCharges: number;
  totalParkingCharges: number;
  totalTollCharges: number;
  totalDriverBatta: number;
  totalExtraDutyCharges: number;
  grandTotalAmount: number;
}

/**
 * Smart calculation of Garage In/Out distance for a duty row
 * Supports both:
 * 1) Distance Method (e.g. 10 KM Out + 10 KM In = 20 KM, or 10 KM Out = 10 KM)
 * 2) Odometer Method (e.g. Garage Out: 10000, Start: 10010, End: 10090, Garage In: 10100 -> 20 KM)
 */
export function computeGarageKm(
  garageOut: number | string | undefined,
  garageIn: number | string | undefined,
  startKm: number | string | undefined = 0,
  endKm: number | string | undefined = 0
): number {
  const gOut = Number(garageOut) || 0;
  const gIn = Number(garageIn) || 0;
  const sKm = Number(startKm) || 0;
  const eKm = Number(endKm) || 0;

  if (gOut === 0 && gIn === 0) return 0;

  // Case 1: Continuous Odometer Readings
  // e.g. Start KM is 10010 and Garage Out is 10000 -> Out leg is 10 KM
  // e.g. End KM is 10090 and Garage In is 10100 -> In leg is 10 KM
  if (sKm > 0 && gOut > 0 && Math.abs(sKm - gOut) <= 250) {
    const outLeg = Math.max(0, sKm - gOut);
    let inLeg = 0;
    if (eKm > 0 && gIn >= eKm && Math.abs(gIn - eKm) <= 250) {
      inLeg = gIn - eKm;
    } else if (gIn > 0 && gIn < 150) {
      inLeg = gIn;
    }
    return Math.round((outLeg + inLeg) * 10) / 10;
  }

  // Case 2: Odometer reading where garageIn > garageOut without start/end
  if (gIn > gOut && gOut > 250 && (sKm === 0 || eKm === 0)) {
    return Math.round((gIn - gOut) * 10) / 10;
  }

  // Case 3: Distance Method (Most common in car rental billing)
  // User enters direct garage run (e.g., 10 KM Out, 10 KM In -> Total = 20 KM)
  return Math.round((gOut + gIn) * 10) / 10;
}


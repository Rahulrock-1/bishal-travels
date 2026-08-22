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

import { format, parseISO, isValid } from 'date-fns';

/**
 * Formats a number to Indian Currency string (₹ 1,23,456.00)
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a number as an integer with Indian commas (1,23,456)
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Formats KM distance string (e.g. "1,240 KM")
 */
export function formatKm(km: number | undefined | null): string {
  return `${formatNumber(km)} KM`;
}

/**
 * Formats hours string (e.g. "8.5 Hrs")
 */
export function formatHours(hrs: number | undefined | null): string {
  if (hrs === undefined || hrs === null || isNaN(hrs)) {
    return '0 Hrs';
  }
  return `${Number(hrs).toFixed(1)} Hrs`;
}

/**
 * Safely format ISO date string or Date object
 */
export function formatDate(dateInput: string | Date | undefined | null, formatStr: string = 'dd MMM yyyy'): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(d)) return typeof dateInput === 'string' ? dateInput : '-';
    return format(d, formatStr);
  } catch {
    return String(dateInput);
  }
}

/**
 * Convert number to Words in Indian numbering format (Lakhs, Crores, Thousands)
 */
export function numberToWordsIndian(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num) || num === 0) {
    return 'Zero Rupees Only';
  }

  const rounded = Math.round((Math.abs(num) + Number.EPSILON) * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return units[n];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit > 0 ? ' ' + units[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${units[hundred]} Hundred`;
    }
    if (rest > 0) {
      if (res.length > 0) res += ' and ';
      res += convertTwoDigits(rest);
    }
    return res;
  }

  function convertNumber(n: number): string {
    if (n === 0) return '';

    const crore = Math.floor(n / 10000000);
    n %= 10000000;

    const lakh = Math.floor(n / 100000);
    n %= 100000;

    const thousand = Math.floor(n / 1000);
    n %= 1000;

    const remainder = n;

    let parts: string[] = [];

    if (crore > 0) {
      parts.push(`${convertNumber(crore)} Crore`);
    }
    if (lakh > 0) {
      parts.push(`${convertTwoDigits(lakh)} Lakh`);
    }
    if (thousand > 0) {
      parts.push(`${convertTwoDigits(thousand)} Thousand`);
    }
    if (remainder > 0) {
      parts.push(convertThreeDigits(remainder));
    }

    return parts.join(' ').trim();
  }

  let words = `Rupees ${convertNumber(rupees)}`;
  if (paise > 0) {
    words += ` and ${convertTwoDigits(paise)} Paise`;
  }
  words += ' Only';

  return words.replace(/\s+/g, ' ');
}

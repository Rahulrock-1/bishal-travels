import React from 'react';
import { CompanyProfile, Vehicle, Client, DutySlip, Invoice } from '../../types';
import { formatDate } from '../../utils/formatters';

export interface DailyReportRow {
  date: string;          // e.g. "01-07-2026"
  hours: number | string;// e.g. 10 or "10 HOURS"
  km: number | string;   // e.g. 85 or "85 KM"
  nightCharge?: number;  // e.g. 350 or 0
  parkingCharge: number; // e.g. 100 or 0
  totalAmount: number;   // e.g. 1450 (includes KM Rate + Overtime + Night + Parking + Toll)
  notes?: string;
  isOff?: boolean;
}

interface BishalMonthlyInvoicePdfTemplateProps {
  company: CompanyProfile;
  vehicle: Vehicle;
  monthTitle: string;    // e.g. "JULY 2026" or "AUGUST 2026"
  invoiceDateStr: string;// e.g. "31-07-2026"
  rows: DailyReportRow[];
  totalHours: number;
  totalKm: number;
  totalNight?: number;
  totalParking: number;
  grandTotalAmount: number;
  client?: Client;
  elementId?: string;
  hideOffDays?: boolean; // Default true: filters out Day Off / Garage Maintenance rows
}

export const BishalMonthlyInvoicePdfTemplate: React.FC<BishalMonthlyInvoicePdfTemplateProps> = ({
  company,
  vehicle,
  monthTitle = 'JULY 2026',
  invoiceDateStr = '31-07-2026',
  rows = [],
  totalHours = 0,
  totalKm = 0,
  totalNight = 0,
  totalParking = 0,
  grandTotalAmount = 0,
  elementId = 'bishal-official-pdf-report',
  hideOffDays = true,
}) => {
  // Filter out Day Off / Garage Maintenance rows so they do not show in the report
  const visibleRows = hideOffDays
    ? rows.filter(r => {
        if (r.isOff) return false;
        const hasKm = Number(r.km) > 0;
        const hasHours = Number(r.hours) > 0;
        const hasNight = Number(r.nightCharge) > 0;
        const hasParking = Number(r.parkingCharge) > 0;
        const hasAmt = Number(r.totalAmount) > 0;
        return hasKm || hasHours || hasNight || hasParking || hasAmt;
      })
    : rows;

  return (
    <div
      id={elementId}
      className="bg-white text-black font-sans mx-auto p-4 sm:p-8 max-w-[850px] shadow-sm border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0"
      style={{
        width: '100%',
        minHeight: '1100px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
      }}
    >
      {/* Outer Enclosing Box matching JULU BISHAL.pdf */}
      <div className="border-2 border-black">
        {/* Top Header: MONTHLY INVOICE & MONTH */}
        <div className="text-center py-2.5 border-b border-black">
          <div className="text-sm font-bold tracking-wider uppercase">
            MONTHLY INVOICE
          </div>
          <div className="text-xs font-bold tracking-wider uppercase mt-0.5">
            {monthTitle.toUpperCase()}
          </div>
        </div>

        {/* 3-Column Header Section */}
        <div className="grid grid-cols-12 border-b border-black text-xs">
          {/* Left Box: TRADE LICENCE, VENDOR ID & VEHICLE NO */}
          <div className="col-span-3 p-3 border-r border-black flex flex-col justify-center space-y-0.5 text-[11px] font-bold">
            <div>TRADE LICENCE - {company.tradeLicenseNo || '1711'}</div>
            {company.vendorId && (
              <div>VENDOR ID - {company.vendorId}</div>
            )}
            <div>VEHICLE NO. {vehicle.regNumber.replace(/\s+/g, '')}</div>
          </div>

          {/* Center Box: BISHAL TRAVELS (Large Title) */}
          <div className="col-span-5 p-3 border-r border-black flex items-center justify-center text-center">
            <h1 className="text-2xl sm:text-3xl font-normal tracking-wide text-black uppercase font-serif">
              {company.businessName || 'BISHAL TRAVELS'}
            </h1>
          </div>

          {/* Right Box: BANK DETAILS & DATE */}
          <div className="col-span-4 p-3 flex flex-col justify-center space-y-0.5 text-[10px] sm:text-[11px] font-bold leading-tight">
            <div>
              {company.bankName || 'STATE BANK OF INDIA'} A/C NO - {company.accountNumber || '44982066411'}
            </div>
            <div>
              IFSC CODE - {company.ifscCode || 'SBIN0002117'}
            </div>
            <div>
              PAN NO - {company.pan || 'BQNPP4333F'}
            </div>
            <div>
              DATE - {invoiceDateStr}
            </div>
          </div>
        </div>

        {/* Address & Contact Bar */}
        <div className="grid grid-cols-12 border-b border-black text-[10px] sm:text-[11px] font-bold">
          <div className="col-span-9 p-2.5 border-r border-black text-center sm:text-left leading-snug">
            {company.address || 'VILL - KALMIKHALI, P.O - ANDHARMANIK, P.S - BISHNUPUR, DIST - SOUTH 24 PARGANAS, PIN - 743503, STATE - WEST BENGAL'}
          </div>
          <div className="col-span-3 p-2.5 flex items-center justify-center text-center font-bold">
            CONTACT NO- {company.phone || '9088933712'}
          </div>
        </div>

        {/* The Clean Day-Wise Duty Table matching JULU BISHAL.pdf */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-center border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-black font-bold uppercase text-[11px]">
                <th className="py-2 px-2 border-r border-black w-24">DATE</th>
                <th className="py-2 px-2 border-r border-black w-24">Hours</th>
                <th className="py-2 px-2 border-r border-black w-24">K.M</th>
                <th className="py-2 px-2 border-r border-black w-28">NIGHT CHARGE</th>
                <th className="py-2 px-2 border-r border-black w-32">PARKING CHARGE</th>
                <th className="py-2 px-2 w-32">TOTAL AMOUNT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-medium">
              {visibleRows.map((row, index) => {
                const hasHours = row.hours !== undefined && row.hours !== '' && Number(row.hours) > 0;
                const hasKm = row.km !== undefined && row.km !== '' && Number(row.km) > 0;
                const nightAmt = Number(row.nightCharge) || 0;
                const parkingAmt = Number(row.parkingCharge) || 0;

                return (
                  <tr key={index} className="h-7 hover:bg-slate-50 transition-colors">
                    {/* Date Column */}
                    <td className="py-1 px-2 border-r border-black font-medium text-[11px]">
                      {row.date}
                    </td>

                    {/* Hours Column */}
                    <td className="py-1 px-2 border-r border-black text-[11px]">
                      {hasHours ? `${row.hours} HOURS` : ''}
                    </td>

                    {/* KM Column */}
                    <td className="py-1 px-2 border-r border-black text-[11px]">
                      {hasKm ? `${row.km} KM` : ''}
                    </td>

                    {/* Night Charge Column */}
                    <td className="py-1 px-2 border-r border-black text-[11px]">
                      {nightAmt > 0 ? `₹ ${nightAmt}` : ''}
                    </td>

                    {/* Parking Charge Column */}
                    <td className="py-1 px-2 border-r border-black text-[11px]">
                      {parkingAmt > 0 ? `₹ ${parkingAmt}` : ''}
                    </td>

                    {/* Total Amount Column (includes KM + Overtime + Surcharges) */}
                    <td className="py-1 px-2 text-[11px] font-semibold">
                      {row.totalAmount > 0 ? `₹ ${row.totalAmount.toLocaleString('en-IN')}` : ''}
                    </td>
                  </tr>
                );
              })}

              {visibleRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 italic text-xs">
                    No active vehicle runs recorded for this month yet.
                  </td>
                </tr>
              )}
            </tbody>
            {/* Bottom Total Row matching JULU BISHAL.pdf */}
            <tfoot>
              <tr className="border-t-2 border-black font-bold text-[11px] uppercase">
                <td className="py-2.5 px-2 border-r border-black font-bold">
                  TOTAL
                </td>
                <td className="py-2.5 px-2 border-r border-black font-bold">
                  {totalHours} HOURS
                </td>
                <td className="py-2.5 px-2 border-r border-black font-bold">
                  {totalKm} KM
                </td>
                <td className="py-2.5 px-2 border-r border-black font-bold">
                  {totalNight > 0 ? `₹ ${totalNight}` : '₹ 0'}
                </td>
                <td className="py-2.5 px-2 border-r border-black font-bold">
                  {totalParking > 0 ? `₹ ${totalParking}` : '₹ 0'}
                </td>
                <td className="py-2.5 px-2 font-bold text-xs">
                  {grandTotalAmount > 0 ? `₹ ${grandTotalAmount.toLocaleString('en-IN')}` : '₹ 0'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { CompanyProfile, Vehicle, Client, DutySlip, Invoice } from '../../types';
import { formatDate } from '../../utils/formatters';

export interface DailyReportRow {
  date: string;          // e.g. "01-07-2026"
  dutySlipNo?: string;   // e.g. "DS-2026-001"
  startTime?: string;    // e.g. "08:30"
  endTime?: string;      // e.g. "18:30"
  hours: number | string;// e.g. 10 or "10 HOURS"
  extraHours?: number | string; // Overtime hours e.g. 2 or 2.5
  extraDuty?: string;    // e.g. "Local Duty" / "Airport Drop" / "Corporate Run"
  extraDutyCharges?: number; // Extra duty charges in ₹
  startKm?: number | string; // Opening KM e.g. 10200
  endKm?: number | string;   // Closing KM e.g. 10320
  km: number | string;   // Run KM e.g. 85 or "85 KM"
  garageOutKm?: number | string; // Opening KM from Garage
  garageInKm?: number | string;  // Closing KM back to Garage
  garageKm?: number | string;    // Total Garage distance
  overtimeCharges?: number;
  nightCharge?: number;  // e.g. 350 or 0
  parkingCharge: number; // e.g. 100 or 0
  tollCharge?: number;
  driverBatta?: number;
  totalAmount: number;   // Daily total amount
  notes?: string;
  isOff?: boolean;
}

export interface BishalMonthlyInvoicePdfTemplateProps {
  company: CompanyProfile;
  vehicle: Vehicle;
  monthTitle: string;    // e.g. "JULY 2026" or "AUGUST 2026"
  invoiceDateStr: string;// e.g. "31-07-2026"
  rows: DailyReportRow[];
  totalHours: number;
  totalKm: number;
  totalOvertimeHours?: number;
  totalGarageKm?: number;
  totalExtraDutyCharges?: number;
  totalNight?: number;
  totalParking: number;
  totalToll?: number;
  totalBatta?: number;
  grandTotalAmount: number;
  client?: Client;
  elementId?: string;
  hideOffDays?: boolean; // Default true: filters out Day Off / Garage Maintenance rows
  showStartEndKm?: boolean; // When enabled, Start KM and End KM columns are rendered
  showStartEndTime?: boolean; // When enabled, Start Time and End Time columns are rendered
  showGarageInOut?: boolean; // When enabled, Garage Out & Garage In KM columns are rendered
  showOvertimeCol?: boolean; // When enabled, Overtime Hours column is rendered
  showExtraDutyCol?: boolean; // When enabled, Extra Duty Charges column is rendered
  hideTotalPrice?: boolean; // When enabled, hides daily Total Amount column (summary break-up remains at the end)
  calcMode?: 'both_km_and_overtime' | 'highest_extra';
  pdfFormat?: 'bishal-official' | 'dual-km-overtime' | 'corporate-duty-annexure' | 'executive-summary';
  ratePerKm?: number;
  overtimeRatePerHour?: number;
  garageRatePerKm?: number;
}

export const BishalMonthlyInvoicePdfTemplate: React.FC<BishalMonthlyInvoicePdfTemplateProps> = ({
  company,
  vehicle,
  monthTitle = 'JULY 2026',
  invoiceDateStr = '31-07-2026',
  rows = [],
  totalHours = 0,
  totalKm = 0,
  totalOvertimeHours = 0,
  totalGarageKm = 0,
  totalExtraDutyCharges = 0,
  totalNight = 0,
  totalParking = 0,
  totalToll = 0,
  totalBatta = 0,
  grandTotalAmount = 0,
  client,
  elementId = 'bishal-official-pdf-report',
  hideOffDays = true,
  showStartEndKm = false,
  showStartEndTime = false,
  showGarageInOut = false,
  showOvertimeCol = true,
  showExtraDutyCol = false,
  hideTotalPrice = false,
  calcMode = 'both_km_and_overtime',
  pdfFormat = 'dual-km-overtime',
  ratePerKm = vehicle.ratePerKm || 18,
  overtimeRatePerHour = vehicle.ratePerHour || 90,
  garageRatePerKm = vehicle.garageRatePerKm || vehicle.ratePerKm || 18,
}) => {
  // Filter out Day Off / Garage Maintenance rows so they do not show in the report
  const visibleRows = hideOffDays
    ? rows.filter(r => {
        if (r.isOff) return false;
        const hasKm = Number(r.km) > 0;
        const hasHours = Number(r.hours) > 0;
        const hasOt = Number(r.extraHours) > 0;
        const hasGarage = Number(r.garageKm) > 0;
        const hasExtraDuty = Number(r.extraDutyCharges) > 0;
        const hasNight = Number(r.nightCharge) > 0;
        const hasParking = Number(r.parkingCharge) > 0;
        const hasToll = Number(r.tollCharge) > 0;
        const hasAmt = Number(r.totalAmount) > 0;
        return hasKm || hasHours || hasOt || hasGarage || hasExtraDuty || hasNight || hasParking || hasToll || hasAmt;
      })
    : rows;

  const kmAmount = totalKm * ratePerKm;
  const overtimeAmount = totalOvertimeHours * overtimeRatePerHour;
  const garageAmount = showGarageInOut ? (totalGarageKm * garageRatePerKm) : 0;
  const totalParkingAndToll = totalParking + totalToll;
  const computedGrandTotal = grandTotalAmount > 0 
    ? grandTotalAmount 
    : (kmAmount + overtimeAmount + garageAmount + totalNight + totalParkingAndToll + totalBatta + totalExtraDutyCharges);

  return (
    <div
      id={elementId}
      className="bg-white text-black font-sans mx-auto p-4 sm:p-6 shadow-sm border border-slate-300 print:border-none print:shadow-none print:p-0 print:m-0 shrink-0"
      style={{
        width: '794px',
        minWidth: '794px',
        maxWidth: '794px',
        minHeight: '1120px',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        boxSizing: 'border-box',
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
              {company.bankName || 'STATE BANK OF INDIA'}
            </div>
            <div>
              A/C NO - {company.accountNumber || '44982066411'}
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
        <div className="grid grid-cols-12 border-b border-black text-[10px] sm:text-[10.5px] font-bold">
          <div className="col-span-9 p-2 border-r border-black text-center sm:text-left leading-snug">
            {company.address || 'VILL - KALMIKHALI, P.O - ANDHARMANIK, P.S - BISHNUPUR, DIST - SOUTH 24 PARGANAS, PIN - 743503, STATE - WEST BENGAL'}
          </div>
          <div className="col-span-3 p-2 flex items-center justify-center text-center font-bold">
            CONTACT NO - {company.phone || '9088933712'}
          </div>
        </div>

        {/* Client & Rate Contract Info Bar (Shows in Dual Mode, Annexure or New Structure - hidden in previous bishal-official format) */}
        {pdfFormat !== 'bishal-official' && (client || pdfFormat === 'dual-km-overtime' || pdfFormat === 'corporate-duty-annexure') && (
          <div className="border-b border-black px-3 py-1.5 bg-slate-50 text-[10px] flex flex-wrap items-center justify-between gap-2 font-medium">
            <div>
              <span className="font-bold uppercase text-slate-800">Billed To: </span>
              <strong>{client?.companyName || client?.name || 'Corporate Client'}</strong>
              {client?.gstin && <span className="ml-2 font-mono">GSTIN: {client.gstin}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9.5px]">
              <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded font-bold">
                Rate: ₹{ratePerKm}/KM
              </span>
              <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded font-bold">
                OT: ₹{overtimeRatePerHour}/Hr
              </span>
              {showGarageInOut && (
                <span className="bg-white px-1.5 py-0.5 border border-slate-300 rounded font-bold">
                  Garage: ₹{garageRatePerKm}/KM
                </span>
              )}
            </div>
          </div>
        )}

        {/* The Clean Day-Wise Duty Table */}
        <div className="w-full overflow-hidden">
          <table className="w-full text-center border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-black font-bold uppercase text-[10px] bg-slate-100/60">
                <th className="py-2 px-1 border-r border-black w-20">DATE</th>

                {/* Optional Start Time & End Time Columns */}
                {showStartEndTime && (
                  <>
                    <th className="py-2 px-1 border-r border-black w-14">Start Time</th>
                    <th className="py-2 px-1 border-r border-black w-14">End Time</th>
                  </>
                )}

                <th className="py-2 px-1 border-r border-black w-16">Hours</th>

                {/* Separated Overtime Column (when enabled or in Dual Mode) */}
                {showOvertimeCol && (
                  <th className="py-2 px-1 border-r border-black w-16 bg-amber-50/70 text-amber-950 font-black">
                    Overtime
                  </th>
                )}

                {/* Separated Extra Duty Charges Column (when enabled) */}
                {showExtraDutyCol && (
                  <th className="py-2 px-1 border-r border-black w-20 text-right font-bold bg-purple-50/50 text-purple-950">
                    Extra Duty (₹)
                  </th>
                )}

                {/* Separated Garage Out KM & Garage In KM Columns (when enabled) */}
                {showGarageInOut && (
                  <>
                    <th className="py-2 px-1 border-r border-black w-16 bg-blue-50/50 text-blue-950 font-bold">
                      Garage Out
                    </th>
                    <th className="py-2 px-1 border-r border-black w-16 bg-blue-50/50 text-blue-950 font-bold">
                      Garage In
                    </th>
                  </>
                )}

                {/* Optional Start KM & End KM Columns */}
                {showStartEndKm && (
                  <>
                    <th className="py-2 px-1 border-r border-black w-16">Start KM</th>
                    <th className="py-2 px-1 border-r border-black w-16">End KM</th>
                  </>
                )}

                <th className="py-2 px-1 border-r border-black w-16">
                  {(showStartEndKm || showStartEndTime || showGarageInOut) ? 'TOTAL KM' : 'K.M'}
                </th>

                <th className="py-2 px-1 border-r border-black w-20">NIGHT CHARGE</th>
                <th className="py-2 px-1 border-r border-black w-22">PARKING CHARGE</th>

                {/* Daily Total Price Column (Hidden if hideTotalPrice is true) */}
                {!hideTotalPrice && (
                  <th className="py-2 px-1.5 w-24">TOTAL AMOUNT</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-medium">
              {visibleRows.map((row, index) => {
                const hasHours = row.hours !== undefined && row.hours !== '' && Number(row.hours) > 0;
                const hasOt = row.extraHours !== undefined && row.extraHours !== '' && Number(row.extraHours) > 0;
                const hasKm = row.km !== undefined && row.km !== '' && Number(row.km) > 0;
                const nightAmt = Number(row.nightCharge) || 0;
                const parkingAmt = (Number(row.parkingCharge) || 0) + (Number(row.tollCharge) || 0);

                const startKmDisplay = row.startKm !== undefined && row.startKm !== '' && Number(row.startKm) > 0
                  ? row.startKm
                  : (row.startKm ? String(row.startKm) : '-');
                const endKmDisplay = row.endKm !== undefined && row.endKm !== '' && Number(row.endKm) > 0
                  ? row.endKm
                  : (row.endKm ? String(row.endKm) : '-');

                const garageOutDisplay = row.garageOutKm !== undefined && row.garageOutKm !== '' && Number(row.garageOutKm) > 0
                  ? row.garageOutKm
                  : '-';
                const garageInDisplay = row.garageInKm !== undefined && row.garageInKm !== '' && Number(row.garageInKm) > 0
                  ? row.garageInKm
                  : '-';

                return (
                  <tr key={index} className="h-6 hover:bg-slate-50 transition-colors">
                    {/* Date Column */}
                    <td className="py-0.5 px-1 border-r border-black font-medium text-[10.5px]">
                      {row.date}
                    </td>

                    {/* Optional Start Time & End Time Columns */}
                    {showStartEndTime && (
                      <>
                        <td className="py-0.5 px-0.5 border-r border-black font-mono text-[10px]">
                          {row.startTime || '-'}
                        </td>
                        <td className="py-0.5 px-0.5 border-r border-black font-mono text-[10px]">
                          {row.endTime || '-'}
                        </td>
                      </>
                    )}

                    {/* Hours Column */}
                    <td className="py-0.5 px-1 border-r border-black text-[10.5px]">
                      {hasHours ? `${row.hours} HOURS` : ''}
                    </td>

                    {/* Separated Overtime Column */}
                    {showOvertimeCol && (
                      <td className="py-0.5 px-1 border-r border-black font-mono text-[10.5px] font-bold text-amber-900 bg-amber-50/30">
                        {hasOt ? `${row.extraHours}h OT` : '-'}
                      </td>
                    )}

                    {/* Separated Extra Duty Charges Column */}
                    {showExtraDutyCol && (
                      <td className="py-0.5 px-1 border-r border-black text-right font-mono text-[10.5px]">
                        {Number(row.extraDutyCharges) > 0 ? `₹ ${Number(row.extraDutyCharges)}` : '-'}
                      </td>
                    )}

                    {/* Separated Garage Out & Garage In KM Columns */}
                    {showGarageInOut && (
                      <>
                        <td className="py-0.5 px-1 border-r border-black font-mono text-[10px]">
                          {garageOutDisplay}
                        </td>
                        <td className="py-0.5 px-1 border-r border-black font-mono text-[10px]">
                          {garageInDisplay}
                        </td>
                      </>
                    )}

                    {/* Optional Start KM & End KM Columns */}
                    {showStartEndKm && (
                      <>
                        <td className="py-0.5 px-1 border-r border-black font-mono text-[10px]">
                          {startKmDisplay}
                        </td>
                        <td className="py-0.5 px-1 border-r border-black font-mono text-[10px]">
                          {endKmDisplay}
                        </td>
                      </>
                    )}

                    {/* Total KM Column */}
                    <td className="py-0.5 px-1 border-r border-black text-[10.5px] font-bold">
                      {hasKm ? `${row.km} KM` : ''}
                    </td>

                    {/* Night Charge Column */}
                    <td className="py-0.5 px-1 border-r border-black text-[10.5px]">
                      {nightAmt > 0 ? `₹ ${nightAmt}` : ''}
                    </td>

                    {/* Parking Charge Column */}
                    <td className="py-0.5 px-1 border-r border-black text-[10.5px]">
                      {parkingAmt > 0 ? `₹ ${parkingAmt}` : ''}
                    </td>

                    {/* Total Amount Column (Conditionally rendered) */}
                    {!hideTotalPrice && (
                      <td className="py-0.5 px-1 text-[10.5px] font-semibold">
                        {row.totalAmount > 0 ? `₹ ${row.totalAmount.toLocaleString('en-IN')}` : ''}
                      </td>
                    )}
                  </tr>
                );
              })}

              {visibleRows.length === 0 && (
                <tr>
                  <td
                    colSpan={
                      5 + 
                      (showStartEndKm ? 2 : 0) + 
                      (showStartEndTime ? 2 : 0) + 
                      (showGarageInOut ? 2 : 0) + 
                      (showOvertimeCol ? 1 : 0) + 
                      (showExtraDutyCol ? 1 : 0) + 
                      (!hideTotalPrice ? 1 : 0)
                    }
                    className="py-8 text-center text-slate-500 italic text-xs"
                  >
                    No active vehicle runs recorded for this month yet.
                  </td>
                </tr>
              )}
            </tbody>

            {/* Bottom Total Row */}
            <tfoot>
              <tr className="border-t-2 border-black font-bold text-[10.5px] uppercase bg-slate-50">
                <td className="py-2 px-1 border-r border-black font-bold">
                  TOTAL
                </td>

                {showStartEndTime && (
                  <>
                    <td className="py-2 px-0.5 border-r border-black text-slate-400 font-normal">-</td>
                    <td className="py-2 px-0.5 border-r border-black text-slate-400 font-normal">-</td>
                  </>
                )}

                <td className="py-2 px-1 border-r border-black font-bold">
                  {totalHours} HOURS
                </td>

                {showOvertimeCol && (
                  <td className="py-2 px-1 border-r border-black font-black text-amber-900 bg-amber-50/70">
                    {totalOvertimeHours}h OT
                  </td>
                )}

                {showExtraDutyCol && (
                  <td className="py-2 px-1 border-r border-black font-mono font-bold text-right text-[10px]">
                    {totalExtraDutyCharges > 0 ? `₹ ${totalExtraDutyCharges}` : '-'}
                  </td>
                )}

                {showGarageInOut && (
                  <>
                    <td className="py-2 px-1 border-r border-black font-mono text-[10px]">-</td>
                    <td className="py-2 px-1 border-r border-black font-mono text-[10px] font-bold">
                      {totalGarageKm > 0 ? `${totalGarageKm} KM` : '-'}
                    </td>
                  </>
                )}

                {showStartEndKm && (
                  <>
                    <td className="py-2 px-1 border-r border-black text-slate-400 font-normal">-</td>
                    <td className="py-2 px-1 border-r border-black text-slate-400 font-normal">-</td>
                  </>
                )}

                <td className="py-2 px-1 border-r border-black font-bold">
                  {totalKm} KM
                </td>

                <td className="py-2 px-1 border-r border-black font-bold">
                  {totalNight > 0 ? `₹ ${totalNight}` : '₹ 0'}
                </td>

                <td className="py-2 px-1 border-r border-black font-bold">
                  {totalParkingAndToll > 0 ? `₹ ${totalParkingAndToll}` : '₹ 0'}
                </td>

                {!hideTotalPrice && (
                  <td className="py-2 px-1 font-bold text-xs">
                    ₹ {computedGrandTotal.toLocaleString('en-IN')}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* AT THE END: CALCULATION BREAK-UP BOX (Only rendered in New Structure formats like dual-km-overtime, hidden in previous bishal-official format) */}
        {pdfFormat !== 'bishal-official' && (
          <div className="border-t-2 border-black p-3 bg-slate-50/90">
            <div className="text-[11px] font-bold uppercase tracking-wider text-black border-b border-black pb-1 mb-2 flex items-center justify-between">
              <span>BILLING CALCULATION BREAK-UP & FINAL SUMMARY</span>
              <span className="text-[9.5px] font-mono lowercase text-slate-600">
                mode: {calcMode === 'both_km_and_overtime' ? 'both km & overtime calculated' : 'standard highest extra'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-[10.5px] font-medium leading-relaxed">
              {/* Left Column: Distance & Time Charges */}
              <div className="space-y-1 border-r border-black/30 pr-3">
                <div className="flex justify-between items-center">
                  <span>Total KM Run ({totalKm} KM × ₹{ratePerKm}/KM):</span>
                  <strong className="font-mono text-black">₹ {kmAmount.toLocaleString('en-IN')}</strong>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total Overtime ({totalOvertimeHours} Hrs × ₹{overtimeRatePerHour}/Hr):</span>
                  <strong className="font-mono text-amber-900">₹ {overtimeAmount.toLocaleString('en-IN')}</strong>
                </div>

                {showGarageInOut && totalGarageKm > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Garage In/Out Run ({totalGarageKm} KM × ₹{garageRatePerKm}/KM):</span>
                    <strong className="font-mono text-blue-900">₹ {garageAmount.toLocaleString('en-IN')}</strong>
                  </div>
                )}
              </div>

              {/* Right Column: Surcharges & Net Amount */}
              <div className="space-y-1 pl-1">
                <div className="flex justify-between items-center">
                  <span>Night Halt Charges:</span>
                  <span className="font-mono font-semibold">₹ {totalNight.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Parking & Toll Charges:</span>
                  <span className="font-mono font-semibold">₹ {totalParkingAndToll.toLocaleString('en-IN')}</span>
                </div>

                {totalBatta > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Driver Batta / Allowance:</span>
                    <span className="font-mono font-semibold">₹ {totalBatta.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {totalExtraDutyCharges > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Extra Duty Charges:</span>
                    <span className="font-mono font-semibold text-purple-900">₹ {totalExtraDutyCharges.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="pt-1 border-t border-black flex justify-between items-center text-xs font-bold text-black">
                  <span className="uppercase">Net Bill Payable Amount:</span>
                  <span className="text-sm font-mono font-black">
                    ₹ {computedGrandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Signatures Box */}
        <div className="grid grid-cols-2 border-t-2 border-black p-4 text-[10.5px]">
          <div>
            <div className="font-bold text-slate-800">CLIENT VERIFICATION & APPROVAL:</div>
            <div className="text-[9.5px] text-slate-500 mt-0.5">
              Verified the vehicle movements and log entries as per contract agreement.
            </div>
            <div className="mt-8 pt-1 border-t border-black w-48 text-center text-[10px] font-bold">
              Authorized Client Signature & Stamp
            </div>
          </div>

          <div className="text-right flex flex-col items-end justify-between">
            <div>
              <div className="font-bold text-black uppercase">
                FOR {company.businessName || 'BISHAL TRAVELS'}
              </div>
              <div className="text-[9.5px] text-slate-500">Authorized Fleet Transporter</div>
            </div>

            <div className="mt-8 pt-1 border-t border-black w-48 text-center text-[10px] font-bold">
              {company.signatoryName && company.signatoryName !== 'Bishal' ? company.signatoryName : 'Biswajit Pramanik'}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

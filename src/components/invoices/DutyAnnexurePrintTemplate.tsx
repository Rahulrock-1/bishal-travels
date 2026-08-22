import React from 'react';
import { Invoice, CompanyProfile, DutySlip, Vehicle } from '../../types';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface DutyAnnexurePrintTemplateProps {
  invoice: Invoice;
  company: CompanyProfile;
  dutySlips: DutySlip[];
  vehicles: Vehicle[];
}

export const DutyAnnexurePrintTemplate: React.FC<DutyAnnexurePrintTemplateProps> = ({
  invoice,
  company,
  dutySlips,
  vehicles,
}) => {
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));

  // Find duty slips attached to this invoice
  const attachedSlips = dutySlips.filter(ds => 
    invoice.attachedDutySlipIds?.includes(ds.id) || ds.invoiceId === invoice.id
  );

  if (attachedSlips.length === 0) return null;

  const totalKm = attachedSlips.reduce((sum, s) => sum + s.totalKm, 0);
  const totalNight = attachedSlips.reduce((sum, s) => sum + s.nightCharges, 0);
  const totalParking = attachedSlips.reduce((sum, s) => sum + s.parkingCharges, 0);
  const totalToll = attachedSlips.reduce((sum, s) => sum + s.tollCharges, 0);

  return (
    <div 
      id={`duty-annexure-doc-${invoice.id}`}
      className="bg-white text-slate-900 p-8 md:p-10 font-sans max-w-[800px] mx-auto border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 mt-8 page-break"
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-300 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-950 uppercase">
            {company.businessName || 'BISHAL TRAVELS'}
          </h2>
          <p className="text-xs font-bold text-emerald-800 uppercase">
            ANNEXURE: DAILY DUTY SLIP & VEHICLE RUN LOG SHEET
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Attached to Tax Invoice No: <strong>{invoice.invoiceNumber}</strong> (Period: {invoice.billingMonth})
          </p>
        </div>

        <div className="text-right text-xs space-y-0.5">
          <div><span className="text-slate-500">Client: </span><strong>{invoice.clientSnapshot?.companyName || invoice.clientSnapshot?.name}</strong></div>
          {invoice.contractRefNo && (
            <div><span className="text-slate-500">Contract: </span><span className="font-mono">{invoice.contractRefNo}</span></div>
          )}
          <div><span className="text-slate-500">Invoice Date: </span><span>{formatDate(invoice.invoiceDate)}</span></div>
        </div>
      </div>

      {/* Annexure Table */}
      <div className="overflow-hidden rounded-lg border border-slate-300 mb-4">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2 px-2.5 border-r border-slate-700">Date</th>
              <th className="py-2 px-2.5 border-r border-slate-700">Slip No</th>
              <th className="py-2 px-2.5 border-r border-slate-700">Vehicle No</th>
              <th className="py-2 px-2.5 border-r border-slate-700">Route / Particulars</th>
              <th className="py-2 px-2 border-r border-slate-700 text-center">Start-End KM</th>
              <th className="py-2 px-2 border-r border-slate-700 text-center">Run (KM)</th>
              <th className="py-2 px-2 border-r border-slate-700 text-center">Timings</th>
              <th className="py-2 px-2 border-r border-slate-700 text-right">Night (₹)</th>
              <th className="py-2 px-2.5 text-right">Park/Toll (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {attachedSlips.map(slip => {
              const veh = vehicleMap.get(slip.vehicleId);
              return (
                <tr key={slip.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2.5 whitespace-nowrap border-r border-slate-200">
                    {formatDate(slip.date, 'dd/MM/yy')}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-[10px] font-bold border-r border-slate-200">
                    {slip.dutySlipNo}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-emerald-900 font-semibold border-r border-slate-200">
                    {veh?.regNumber || 'Vehicle'}
                  </td>
                  <td className="py-2 px-2.5 border-r border-slate-200 max-w-[160px] truncate" title={slip.route}>
                    {slip.route}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-[10px] border-r border-slate-200">
                    {slip.startKm} - {slip.endKm}
                  </td>
                  <td className="py-2 px-2 text-center font-mono font-bold border-r border-slate-200 text-slate-950">
                    {slip.totalKm}
                  </td>
                  <td className="py-2 px-2 text-center text-[10px] border-r border-slate-200">
                    {slip.startTime}-{slip.endTime}
                  </td>
                  <td className="py-2 px-2 text-right font-mono border-r border-slate-200">
                    {slip.nightCharges > 0 ? `₹${slip.nightCharges}` : '-'}
                  </td>
                  <td className="py-2 px-2.5 text-right font-mono">
                    {(slip.parkingCharges + slip.tollCharges) > 0 ? `₹${slip.parkingCharges + slip.tollCharges}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
              <td colSpan={5} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider">
                Total Monthly Run & Surcharges:
              </td>
              <td className="py-2.5 px-2 text-center font-mono text-xs font-black text-emerald-950">
                {totalKm} KM
              </td>
              <td></td>
              <td className="py-2.5 px-2 text-right font-mono text-xs text-amber-900">
                {totalNight > 0 ? `₹${totalNight}` : '-'}
              </td>
              <td className="py-2.5 px-2.5 text-right font-mono text-xs text-blue-900">
                {(totalParking + totalToll) > 0 ? `₹${totalParking + totalToll}` : '-'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Signature */}
      <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs">
        <div className="text-[10px] text-slate-500">
          Certified that the vehicle(s) were engaged on official duty as per the log sheet entries above.
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-900 uppercase block">
            FOR {company.businessName || 'BISHAL TRAVELS'}
          </span>
          <div className="mt-6 pt-1 border-t border-slate-400 w-36 text-center text-[10px] text-slate-700">
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
};

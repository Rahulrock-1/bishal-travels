import React, { useState } from 'react';
import { 
  Building2, 
  Car, 
  Download, 
  FileSpreadsheet, 
  Printer, 
  TrendingUp, 
  Calendar, 
  Users, 
  Moon, 
  ParkingSquare,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters';
import { downloadInvoiceAsPdf, triggerPrint } from '../../utils/pdfGenerator';
import { Badge } from '../common/Badge';

export const MonthlyReportView: React.FC = () => {
  const { company, vehicles, clients, dutySlips, invoices } = useApp();

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [selectedMonth, setSelectedMonth] = useState(currentMonthName);
  const [reportTab, setReportTab] = useState<'vehicles' | 'clients' | 'surcharges'>('vehicles');

  // Month list for dropdown
  const monthOptions = Array.from(new Set([
    currentMonthName,
    'July 2026',
    'June 2026',
    'May 2026',
    ...invoices.map(inv => inv.billingMonth)
  ]));

  // Calculate vehicle metrics
  const vehicleMetrics = vehicles.map(v => {
    const slips = dutySlips.filter(s => s.vehicleId === v.id);
    const totalKm = slips.reduce((sum, s) => sum + s.totalKm, 0);
    const totalTrips = slips.length;
    const totalNight = slips.reduce((sum, s) => sum + s.nightCharges, 0);
    const totalParking = slips.reduce((sum, s) => sum + s.parkingCharges, 0);
    const totalToll = slips.reduce((sum, s) => sum + s.tollCharges, 0);
    const totalDriverBatta = slips.reduce((sum, s) => sum + s.driverBatta, 0);

    // Invoices for this vehicle
    const vehicleInvoices = invoices.filter(inv => 
      inv.items.some(it => it.vehicleRegNo === v.regNumber)
    );
    const billedRevenue = vehicleInvoices.reduce((sum, inv) => {
      const matchingItems = inv.items.filter(it => it.vehicleRegNo === v.regNumber);
      return sum + matchingItems.reduce((iSum, it) => iSum + it.amount, 0);
    }, 0);

    return {
      vehicle: v,
      totalKm,
      totalTrips,
      totalNight,
      totalParking,
      totalToll,
      totalDriverBatta,
      billedRevenue: billedRevenue > 0 ? billedRevenue : (totalKm * v.ratePerKm),
    };
  });

  // Calculate client metrics
  const clientMetrics = clients.map(c => {
    const clientInvoices = invoices.filter(inv => inv.clientId === c.id);
    const totalInvoiced = clientInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = clientInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.netPayable, 0);
    const totalPending = clientInvoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.netPayable, 0);
    const clientSlips = dutySlips.filter(s => s.clientId === c.id);
    const totalKm = clientSlips.reduce((sum, s) => sum + s.totalKm, 0);

    return {
      client: c,
      totalInvoices: clientInvoices.length,
      totalInvoiced,
      totalPaid,
      totalPending,
      totalTrips: clientSlips.length,
      totalKm,
    };
  });

  // Totals
  const grandTotalKm = vehicleMetrics.reduce((sum, vm) => sum + vm.totalKm, 0);
  const grandTotalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const grandTotalNight = dutySlips.reduce((sum, s) => sum + s.nightCharges, 0);
  const grandTotalParkingToll = dutySlips.reduce((sum, s) => sum + (s.parkingCharges + s.tollCharges), 0);

  const handleDownloadReportPdf = () => {
    downloadInvoiceAsPdf('monthly-report-printable-container', `${company.businessName || 'Bishal_Travels'}_Monthly_Statement_${selectedMonth}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <span>Monthly Fleet Billing & Performance Report</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Vehicle utilization summary, client-wise statements, and surcharge logs for <strong>{company.businessName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={triggerPrint}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadReportPdf}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all hover:shadow"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Fleet Distance</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{grandTotalKm} KM</span>
          <span className="text-[11px] text-slate-500">{vehicles.length} Active Vehicles</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Gross Invoiced Revenue</span>
          <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">{formatCurrency(grandTotalRevenue)}</span>
          <span className="text-[11px] text-slate-500">{invoices.length} Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Total Night Charges</span>
          <span className="text-xl font-black text-amber-800 font-mono mt-1 block">{formatCurrency(grandTotalNight)}</span>
          <span className="text-[11px] text-slate-500">O/S Night Halts</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-blue-700 block">Parking & Toll Surcharges</span>
          <span className="text-xl font-black text-blue-800 font-mono mt-1 block">{formatCurrency(grandTotalParkingToll)}</span>
          <span className="text-[11px] text-slate-500">Billed At Actuals</span>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-2 rounded-t-2xl border-x border-t gap-2">
        <button
          onClick={() => setReportTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            reportTab === 'vehicles'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Vehicle-Wise Run & Revenue</span>
        </button>

        <button
          onClick={() => setReportTab('clients')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            reportTab === 'clients'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Client Billing Statement</span>
        </button>
      </div>

      {/* Report Container */}
      <div id="monthly-report-printable-container" className="bg-white p-6 rounded-b-2xl border border-slate-200 shadow-sm space-y-6">
        
        {/* Printable Header for PDF */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-950 uppercase">{company.businessName}</h1>
              <p className="text-xs font-bold text-emerald-800 uppercase">MONTHLY OPERATIONAL & FINANCIAL REPORT</p>
              <p className="text-[11px] text-slate-600 mt-1">Trade License: {company.tradeLicenseNo} | GSTIN: {company.gstin}</p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-500">Report Generated: </span>
              <strong>{formatDate(new Date())}</strong>
            </div>
          </div>
        </div>

        {/* Tab 1: Vehicles */}
        {reportTab === 'vehicles' && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Vehicle-wise Performance & Run Statement
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Vehicle No</th>
                    <th className="py-2.5 px-3">Model / Type</th>
                    <th className="py-2.5 px-3">Driver</th>
                    <th className="py-2.5 px-3 text-center">Total Trips</th>
                    <th className="py-2.5 px-3 text-center">Total Run (KM)</th>
                    <th className="py-2.5 px-3 text-right">Night Halt (₹)</th>
                    <th className="py-2.5 px-3 text-right">Parking/Toll (₹)</th>
                    <th className="py-2.5 px-3 text-right">Estimated Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {vehicleMetrics.map(vm => (
                    <tr key={vm.vehicle.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-950">
                        {vm.vehicle.regNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {vm.vehicle.model}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {vm.vehicle.driverName || '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        {vm.totalTrips}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-900">
                        {vm.totalKm} KM
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-amber-800">
                        {vm.totalNight > 0 ? `₹${vm.totalNight}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-blue-800">
                        {(vm.totalParking + vm.totalToll) > 0 ? `₹${vm.totalParking + vm.totalToll}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-slate-950 text-sm">
                        {formatCurrency(vm.billedRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <td colSpan={3} className="py-2.5 px-3 uppercase text-[10px]">Fleet Totals:</td>
                    <td className="py-2.5 px-3 text-center">{dutySlips.length} Trips</td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-950 font-black">{grandTotalKm} KM</td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-900">{formatCurrency(grandTotalNight)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-900">{formatCurrency(grandTotalParkingToll)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-950 font-black">{formatCurrency(grandTotalRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Clients */}
        {reportTab === 'clients' && (
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Client Accounts & Outstanding Statement
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Client Company</th>
                    <th className="py-2.5 px-3">Contract Ref</th>
                    <th className="py-2.5 px-3 text-center">Invoices</th>
                    <th className="py-2.5 px-3 text-center">Total KM Run</th>
                    <th className="py-2.5 px-3 text-right">Total Invoiced (₹)</th>
                    <th className="py-2.5 px-3 text-right">Paid (₹)</th>
                    <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {clientMetrics.map(cm => (
                    <tr key={cm.client.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-950">
                        {cm.client.companyName || cm.client.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-800 font-semibold">
                        {cm.client.contractRefNo || '-'}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold">
                        {cm.totalInvoices}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {cm.totalKm} KM
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(cm.totalInvoiced)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(cm.totalPaid)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-amber-800">
                        {formatCurrency(cm.totalPending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

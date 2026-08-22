import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Car, 
  ClipboardList, 
  Users, 
  PlusCircle, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Building2, 
  Download,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatCard } from '../common/StatCard';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export const DashboardOverview: React.FC = () => {
  const { 
    company, 
    vehicles, 
    clients, 
    dutySlips, 
    invoices, 
    setActiveTab, 
    setSelectedInvoiceForView, 
    setIsSettingsModalOpen 
  } = useApp();

  // Metrics
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const pendingRevenue = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.netPayable, 0);
  const totalKmRun = dutySlips.reduce((sum, s) => sum + s.totalKm, 0);
  const unbilledSlips = dutySlips.filter(s => s.status === 'Pending');
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Official Travel Billing System</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {company.businessName || 'BISHAL TRAVELS'}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Generate accurate monthly client invoices based on vehicle odometer runs, night halts, parking charges, and download official, print-ready PDF reports.
            </p>

            <div className="flex flex-wrap gap-2 pt-2 text-[11px]">
              <span className="px-2.5 py-1 bg-white/10 rounded-lg text-slate-300 font-mono">
                Trade License: <strong className="text-white">{company.tradeLicenseNo}</strong>
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-lg text-slate-300 font-mono">
                IFSC: <strong className="text-emerald-300">{company.ifscCode}</strong>
              </span>
              <span className="px-2.5 py-1 bg-white/10 rounded-lg text-slate-300 font-mono">
                A/C: <strong className="text-white">{company.accountNumber}</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setActiveTab('create-invoice')}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 hover:scale-[1.02] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Generate Monthly Invoice</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Edit Bank & Details</span>
            </button>
          </div>
        </div>

        {/* Subtle Decorative Background Glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Billed Revenue"
          value={formatCurrency(totalRevenue)}
          subtitle={`${invoices.length} Invoices Generated`}
          icon={FileText}
          color="emerald"
          onClick={() => setActiveTab('invoices')}
        />

        <StatCard
          title="Outstanding Balance"
          value={formatCurrency(pendingRevenue)}
          subtitle="Pending Payment Clearance"
          icon={Clock}
          color="amber"
          onClick={() => setActiveTab('invoices')}
        />

        <StatCard
          title="Total Distance Run"
          value={formatKm(totalKmRun)}
          subtitle={`${dutySlips.length} Total Trips Logged`}
          icon={Car}
          color="blue"
          onClick={() => setActiveTab('duty-slips')}
        />

        <StatCard
          title="Active Fleet"
          value={`${vehicles.length} Cars`}
          subtitle={`${unbilledSlips.length} Unbilled Duty Slips`}
          icon={Users}
          color="purple"
          onClick={() => setActiveTab('vehicles')}
        />
      </div>

      {/* Main Content Grid: Recent Invoices & Pending Duty Slips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Recent Invoices
              </h3>
              <p className="text-xs text-slate-500">Latest generated client invoices and payment status</p>
            </div>

            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-y border-slate-100">
                  <th className="py-2.5 px-3">Invoice No</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {inv.clientSnapshot?.companyName || inv.clientSnapshot?.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {inv.billingMonth}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.netPayable)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Badge
                        variant={inv.status === 'Paid' ? 'success' : inv.status === 'Sent' ? 'info' : 'warning'}
                        size="sm"
                        dot
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="px-2 py-1 text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View / PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Quick Actions & Fleet Status */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Quick Operations
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('duty-slips')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-between transition-colors border border-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-emerald-600" />
                  <span>Log Daily Car Run / Duty Slip</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('vehicles')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-between transition-colors border border-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span>Manage Cars & Drivers</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-between transition-colors border border-slate-200/70"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span>Monthly Revenue Statements</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Bank & Legal Snapshot Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Active Bank Account
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-[11px] text-slate-400 hover:text-white underline"
              >
                Edit
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank:</span>
                <strong className="text-white">{company.bankName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">A/C No:</span>
                <strong className="font-mono text-white">{company.accountNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IFSC Code:</span>
                <strong className="font-mono text-emerald-400">{company.ifscCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trade License:</span>
                <strong className="font-mono text-white">{company.tradeLicenseNo}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

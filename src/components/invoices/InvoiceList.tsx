import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Eye, 
  Download, 
  Printer, 
  Trash2, 
  Calendar, 
  Building, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { downloadInvoiceAsPdf, triggerPrint } from '../../utils/pdfGenerator';
import { Badge } from '../common/Badge';

export const InvoiceList: React.FC = () => {
  const { 
    invoices, 
    clients, 
    company, 
    deleteInvoice, 
    updateInvoiceStatus, 
    setSelectedInvoiceForView, 
    setActiveTab 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');

  const filteredInvoices = invoices.filter(inv => {
    const clientName = inv.clientSnapshot?.companyName || inv.clientSnapshot?.name || '';
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.billingMonth.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.contractRefNo && inv.contractRefNo.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    const matchesClient = clientFilter === 'All' || inv.clientId === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  // Summary Metrics
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.netPayable, 0);
  const totalPending = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.netPayable, 0);

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${number}? Attached duty slips will be released back to pending status.`)) {
      deleteInvoice(id);
    }
  };

  const handleQuickDownload = (inv: Invoice) => {
    setSelectedInvoiceForView(inv);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>Monthly Invoices & Billing History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track generated invoices, payment clearance, auto-populated bank receipts, and PDF exports
          </p>
        </div>

        <button
          onClick={() => setActiveTab('create-invoice')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Invoice</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Revenue Invoiced</span>
          <span className="text-xl font-black text-slate-900 font-mono mt-1 block">{formatCurrency(totalBilled)}</span>
          <span className="text-[11px] text-slate-500">{invoices.length} Total Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm bg-emerald-50/20">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Payments Received</span>
          <span className="text-xl font-black text-emerald-800 font-mono mt-1 block">{formatCurrency(totalPaid)}</span>
          <span className="text-[11px] text-emerald-600">Cleared Invoices</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm bg-amber-50/20">
          <span className="text-[10px] uppercase font-bold text-amber-700 block">Outstanding Balance</span>
          <span className="text-xl font-black text-amber-800 font-mono mt-1 block">{formatCurrency(totalPending)}</span>
          <span className="text-[11px] text-amber-600">Pending Clearance</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search by invoice #, client, contract, month..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />

        <select
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-sm font-medium"
        >
          <option value="All">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-sm font-medium"
        >
          <option value="All">All Payment Status</option>
          <option value="Sent">Sent (Pending)</option>
          <option value="Paid">Paid</option>
          <option value="Draft">Draft</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Invoice No / Date</th>
                <th className="py-3 px-4">Client / Contract</th>
                <th className="py-3 px-4">Billing Month</th>
                <th className="py-3 px-4 text-right">Taxable Subtotal</th>
                <th className="py-3 px-4 text-right">Net Payable</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredInvoices.map(invoice => {
                const clientName = invoice.clientSnapshot?.companyName || invoice.clientSnapshot?.name || 'Unknown Client';

                return (
                  <tr key={invoice.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-950 block text-xs">{invoice.invoiceNumber}</span>
                      <span className="text-[11px] text-slate-500">{formatDate(invoice.invoiceDate)}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{clientName}</span>
                      {invoice.contractRefNo && (
                        <span className="text-[10px] font-mono text-emerald-800 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                          {invoice.contractRefNo}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{invoice.billingMonth}</span>
                      <span className="text-[10px] text-slate-400 block">Due: {formatDate(invoice.dueDate)}</span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                      {formatCurrency(invoice.subtotal)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-slate-950 text-sm">
                      {formatCurrency(invoice.netPayable)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={
                          invoice.status === 'Paid' ? 'success' :
                          invoice.status === 'Sent' ? 'info' :
                          invoice.status === 'Overdue' ? 'danger' :
                          invoice.status === 'Partially Paid' ? 'warning' : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {invoice.status}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedInvoiceForView(invoice)}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-emerald-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        title="View / Download PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / PDF</span>
                      </button>

                      <button
                        onClick={() => handleDelete(invoice.id, invoice.invoiceNumber)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-block"
                        title="Delete invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12 p-8">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No invoices found</h4>
            <p className="text-xs text-slate-500 mt-1">Generate your first monthly invoice to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

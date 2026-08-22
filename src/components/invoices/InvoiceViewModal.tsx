import React, { useState } from 'react';
import { 
  Download, 
  Printer, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Share2, 
  FileText,
  FileCheck,
  Building,
  CreditCard
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus } from '../../types';
import { InvoicePrintTemplate } from './InvoicePrintTemplate';
import { DutyAnnexurePrintTemplate } from './DutyAnnexurePrintTemplate';
import { downloadInvoiceAsPdf, triggerPrint } from '../../utils/pdfGenerator';
import { Badge } from '../common/Badge';

export const InvoiceViewModal: React.FC = () => {
  const { 
    company, 
    vehicles, 
    dutySlips, 
    selectedInvoiceForView, 
    setSelectedInvoiceForView,
    updateInvoiceStatus 
  } = useApp();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [includeAnnexure, setIncludeAnnexure] = useState(true);

  if (!selectedInvoiceForView) return null;

  const invoice = selectedInvoiceForView;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const elementId = `invoice-full-render-container`;
    const filename = `${company.businessName || 'Bishal_Travels'}_Invoice_${invoice.invoiceNumber.replace(/\//g, '-')}_${invoice.billingMonth}`;
    
    await downloadInvoiceAsPdf(elementId, filename);
    setIsGeneratingPdf(false);
  };

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    updateInvoiceStatus(invoice.id, newStatus);
    setSelectedInvoiceForView({
      ...invoice,
      status: newStatus,
    });
  };

  const handleCopyDetails = () => {
    const text = `*${company.businessName || 'BISHAL TRAVELS'} - INVOICE*\n` +
      `Invoice No: ${invoice.invoiceNumber}\n` +
      `Client: ${invoice.clientSnapshot?.companyName || invoice.clientSnapshot?.name}\n` +
      `Billing Month: ${invoice.billingMonth}\n` +
      `Total Net Payable: ₹${invoice.netPayable.toLocaleString('en-IN')}\n` +
      `Bank: ${invoice.bankDetails?.bankName} | A/C: ${invoice.bankDetails?.accountNumber} | IFSC: ${invoice.bankDetails?.ifscCode}\n` +
      `UPI ID: ${invoice.bankDetails?.upiId || 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <Modal
      isOpen={!!selectedInvoiceForView}
      onClose={() => setSelectedInvoiceForView(null)}
      title={`Invoice: ${invoice.invoiceNumber} (${invoice.billingMonth})`}
      subtitle={`Billed to ${invoice.clientSnapshot?.companyName || invoice.clientSnapshot?.name}`}
      maxWidth="5xl"
    >
      <div className="space-y-4">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 text-white rounded-xl shadow-sm no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase">Status:</span>
            <select
              value={invoice.status}
              onChange={e => handleStatusChange(e.target.value as InvoiceStatus)}
              className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent (Pending Payment)</option>
              <option value="Paid">Paid (Completed)</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyDetails}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedNotification ? 'Copied Details!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={triggerPrint}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Render Container for high resolution print & PDF */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-4 md:p-6 shadow-inner">
          <div id="invoice-full-render-container" className="space-y-6">
            <InvoicePrintTemplate invoice={invoice} company={company} />
            
            {includeAnnexure && (
              <DutyAnnexurePrintTemplate
                invoice={invoice}
                company={company}
                dutySlips={dutySlips}
                vehicles={vehicles}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

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
  CreditCard,
  Layers,
  Sparkles
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoiceStatus } from '../../types';
import { InvoicePrintTemplate } from './InvoicePrintTemplate';
import { DutyAnnexurePrintTemplate } from './DutyAnnexurePrintTemplate';
import { BishalMonthlyInvoicePdfTemplate, DailyReportRow } from './BishalMonthlyInvoicePdfTemplate';
import { downloadInvoiceAsPdf, triggerPrint } from '../../utils/pdfGenerator';
import { formatDate } from '../../utils/formatters';

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
  
  // Format Template Choice: 'bishal-official' (Exact match to JULU BISHAL.pdf) vs 'corporate-tax'
  const [templateFormat, setTemplateFormat] = useState<'bishal-official' | 'corporate-tax'>('bishal-official');

  if (!selectedInvoiceForView) return null;

  const invoice = selectedInvoiceForView;

  // Find vehicle associated with invoice
  const primaryVehicle = vehicles.find(v => 
    invoice.items.some(it => it.vehicleRegNo === v.regNumber)
  ) || vehicles[0];

  // Find attached duty slips or construct day-by-day rows for the month
  const attachedSlips = dutySlips.filter(ds => 
    invoice.attachedDutySlipIds?.includes(ds.id) || ds.invoiceId === invoice.id
  );

  // Generate 30/31 Day Rows matching the JULU BISHAL.pdf format
  const generateBishalReportRows = (): {
    rows: DailyReportRow[];
    totalHours: number;
    totalKm: number;
    totalOvertime: number;
    totalNight: number;
    totalParking: number;
  } => {
    // Parse billing month (e.g. "July 2026", "2026-07")
    let year = 2026;
    let monthIndex = 6; // July (0-indexed)

    if (invoice.billingMonth) {
      const parts = invoice.billingMonth.split(' ');
      if (parts.length === 2 && !isNaN(Number(parts[1]))) {
        year = Number(parts[1]);
        const mNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const foundM = mNames.findIndex(m => m.startsWith(parts[0].toLowerCase().slice(0, 3)));
        if (foundM !== -1) monthIndex = foundM;
      }
    }

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const slipDateMap = new Map(attachedSlips.map(s => [s.date, s]));

    const rows: DailyReportRow[] = [];
    let sumHours = 0;
    let sumKm = 0;
    let sumOt = 0;
    let sumNight = 0;
    let sumParking = 0;
    const rateKm = primaryVehicle?.ratePerKm || 14;
    const rateOt = primaryVehicle?.ratePerHour || 100;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, monthIndex, day);
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const displayDate = `${String(day).padStart(2, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${year}`;
      
      const slip = slipDateMap.get(dateStr);

      if (slip) {
        const hours = slip.totalHours || 0;
        const km = slip.totalKm || 0;
        const night = slip.nightCharges || 0;
        const parking = (slip.parkingCharges || 0) + (slip.tollCharges || 0);
        const baseKm = 100;
        const baseHrs = 10;
        const basePrice = (km > 0 || hours > 0) ? baseKm * rateKm : 0;
        const extraKmCharge = Math.max(0, km - baseKm) * rateKm;
        const extraHourCharge = Math.max(0, hours - baseHrs) * rateOt;
        const highestExtra = Math.max(extraKmCharge, extraHourCharge);
        const dayTotal = basePrice + highestExtra + night + parking;
        const isOffDay = km === 0 && (slip.route?.toLowerCase().includes('off') || slip.route?.toLowerCase().includes('garage'));

        if (!isOffDay && (km > 0 || hours > 0 || night > 0 || parking > 0)) {
          sumHours += hours;
          sumKm += km;
          sumNight += night;
          sumParking += parking;

          rows.push({
            date: displayDate,
            hours: hours > 0 ? hours : '',
            km: km > 0 ? km : '',
            nightCharge: night > 0 ? night : undefined,
            parkingCharge: parking,
            totalAmount: dayTotal,
            isOff: false,
          });
        }
      }
    }

    // If attached slips was empty, check if invoice items had run info
    if (attachedSlips.length === 0 && invoice.items.length > 0) {
      const mainItem = invoice.items[0];
      sumKm = mainItem.totalRunKm || 0;
      sumHours = 0;
      sumOt = mainItem.extraHourCharges || 0;
      sumNight = mainItem.nightCharges || 0;
      sumParking = (mainItem.parkingCharges || 0) + (mainItem.tollCharges || 0);
    }

    return {
      rows,
      totalHours: Math.round(sumHours),
      totalKm: sumKm,
      totalOvertime: sumOt,
      totalNight: sumNight,
      totalParking: sumParking,
    };
  };

  const bishalReportData = generateBishalReportRows();

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const elementId = templateFormat === 'bishal-official' 
      ? `bishal-official-pdf-report` 
      : `invoice-full-render-container`;
      
    const filename = `${company.businessName || 'Bishal_Travels'}_${invoice.billingMonth.replace(/\s+/g, '_')}_${invoice.invoiceNumber.replace(/\//g, '-')}`;
    
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
      `Vehicle No: ${primaryVehicle.regNumber}\n` +
      `Month: ${invoice.billingMonth}\n` +
      `Total Net Payable: ₹${invoice.netPayable.toLocaleString('en-IN')}\n` +
      `Bank: ${invoice.bankDetails?.bankName || company.bankName} | A/C: ${invoice.bankDetails?.accountNumber || company.accountNumber} | IFSC: ${invoice.bankDetails?.ifscCode || company.ifscCode}\n` +
      `Contact: ${company.phone}`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <Modal
      isOpen={!!selectedInvoiceForView}
      onClose={() => setSelectedInvoiceForView(null)}
      title={`Monthly Invoice - ${company.businessName} (${invoice.billingMonth})`}
      subtitle={`Vehicle No: ${primaryVehicle.regNumber} | Client: ${invoice.clientSnapshot?.companyName || invoice.clientSnapshot?.name}`}
      maxWidth="5xl"
    >
      <div className="space-y-4">
        {/* Top Format Selector & Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm no-print">
          
          {/* Format Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase mr-1">Format:</span>
            
            <button
              type="button"
              onClick={() => setTemplateFormat('bishal-official')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                templateFormat === 'bishal-official'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official Format (JULU BISHAL Style)</span>
            </button>

            <button
              type="button"
              onClick={() => setTemplateFormat('corporate-tax')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                templateFormat === 'corporate-tax'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Corporate Tax Bill</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <select
              value={invoice.status}
              onChange={e => handleStatusChange(e.target.value as InvoiceStatus)}
              className="px-2.5 py-1.5 text-xs font-bold bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent (Pending)</option>
              <option value="Paid">Paid</option>
              <option value="Partially Paid">Partially Paid</option>
            </select>

            <button
              onClick={handleCopyDetails}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{copiedNotification ? 'Copied!' : 'Copy Summary'}</span>
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
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Live Document Preview Container */}
        <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-slate-100 p-2 sm:p-4 md:p-6 shadow-inner flex justify-start md:justify-center">
          {/* FORMAT 1: EXACT MATCH TO JULU BISHAL.pdf */}
          {templateFormat === 'bishal-official' && (
            <BishalMonthlyInvoicePdfTemplate
              company={company}
              vehicle={primaryVehicle}
              monthTitle={invoice.billingMonth || 'JULY 2026'}
              invoiceDateStr={formatDate(invoice.invoiceDate, 'dd-MM-yyyy')}
              rows={bishalReportData.rows}
              totalHours={bishalReportData.totalHours}
              totalKm={bishalReportData.totalKm}
              totalNight={bishalReportData.totalNight}
              totalParking={bishalReportData.totalParking}
              grandTotalAmount={invoice.netPayable || invoice.grandTotal}
              client={invoice.clientSnapshot}
              elementId="bishal-official-pdf-report"
            />
          )}

          {/* FORMAT 2: CORPORATE TAX INVOICE */}
          {templateFormat === 'corporate-tax' && (
            <div id="invoice-full-render-container" className="space-y-6 w-full max-w-[800px]">
              <InvoicePrintTemplate invoice={invoice} company={company} />
              <DutyAnnexurePrintTemplate
                invoice={invoice}
                company={company}
                dutySlips={dutySlips}
                vehicles={vehicles}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

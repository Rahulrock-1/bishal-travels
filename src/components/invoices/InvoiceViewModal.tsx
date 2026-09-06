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
import { computeGarageKm } from '../../utils/calculations';

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
  
  // Format Template Choice - Default to previous format 'bishal-official'
  const [templateFormat, setTemplateFormat] = useState<
    'dual-km-overtime' | 'bishal-official' | 'corporate-duty-annexure' | 'executive-summary' | 'corporate-tax'
  >('bishal-official');
  const [calcMode, setCalcMode] = useState<'both_km_and_overtime' | 'highest_extra'>('highest_extra');
  // Column and visibility toggles
  const [showStartEndKm, setShowStartEndKm] = useState(false);
  const [showStartEndTime, setShowStartEndTime] = useState(false);
  const [showGarageInOut, setShowGarageInOut] = useState(false);
  const [defaultGarageKm, setDefaultGarageKm] = useState(20);
  const [showOvertimeCol, setShowOvertimeCol] = useState(false);
  const [showExtraDutyCol, setShowExtraDutyCol] = useState(false);
  const [hideTotalPrice, setHideTotalPrice] = useState(false);

  if (!selectedInvoiceForView) return null;

  const invoice = selectedInvoiceForView;

  // Find vehicle associated with invoice
  const primaryVehicle = vehicles.find(v => 
    invoice.items.some(it => it.vehicleRegNo === v.regNumber)
  ) || vehicles[0];

  // Find attached duty slips or construct day-by-day rows for the month
  const attachedSlips = dutySlips.filter(ds => 
    invoice.attachedDutySlipIds?.includes(ds.id) || 
    ds.invoiceId === invoice.id ||
    (primaryVehicle && ds.vehicleId === primaryVehicle.id)
  );

  // Generate 30/31 Day Rows matching the JULU BISHAL.pdf format
  const generateBishalReportRows = (): {
    rows: DailyReportRow[];
    totalHours: number;
    totalKm: number;
    totalOvertimeHours: number;
    totalGarageKm: number;
    totalNight: number;
    totalParking: number;
    totalToll: number;
    totalBatta: number;
    totalExtraDutyCharges: number;
    grandTotalAmount: number;
    rateKm: number;
    rateOt: number;
    rateGarage: number;
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
    let sumGarageKm = 0;
    let sumNight = 0;
    let sumParking = 0;
    let sumToll = 0;
    let sumBatta = 0;
    let sumExtraDuty = 0;
    let sumTotal = 0;
    const rateKm = primaryVehicle?.ratePerKm || 14;
    const rateOt = primaryVehicle?.ratePerHour || 100;
    const rateGarage = primaryVehicle?.garageRatePerKm || rateKm;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const displayDate = `${String(day).padStart(2, '0')}-${String(monthIndex + 1).padStart(2, '0')}-${year}`;
      
      const slip = slipDateMap.get(dateStr);

      if (slip) {
        const hours = slip.totalHours || 0;
        const extraHours = slip.extraHours !== undefined ? slip.extraHours : Math.max(0, hours - 10);
        const km = slip.totalKm || 0;
        const startKm = slip.startKm || 0;
        const endKm = slip.endKm || 0;
        const startTime = slip.startTime || '';
        const endTime = slip.endTime || '';
        let gOut = Number(slip.garageOutKm) || 0;
        let gIn = Number(slip.garageInKm) || 0;
        let garageKm = 0;

        // ONLY calculate and apply garage run if showGarageInOut is TRUE!
        if (showGarageInOut) {
          const rawGarageKm = (Number(slip.garageKm) || 0) > 0 
            ? Number(slip.garageKm) 
            : computeGarageKm(gOut, gIn, startKm, endKm);
          garageKm = rawGarageKm > 0 ? rawGarageKm : (km > 0 ? defaultGarageKm : 0);
          if (garageKm > 0 && gOut === 0 && gIn === 0) {
            gOut = Math.round((garageKm / 2) * 10) / 10;
            gIn = Math.round((garageKm / 2) * 10) / 10;
          }
        }

        const garageOutDisplay = showGarageInOut && gOut > 0 ? gOut : (showGarageInOut ? (slip.garageOutKm || '') : '');
        const garageInDisplay = showGarageInOut && gIn > 0 ? gIn : (showGarageInOut ? (slip.garageInKm || '') : '');
        const night = slip.nightCharges || 0;
        const parking = slip.parkingCharges || 0;
        const toll = slip.tollCharges || 0;
        const batta = slip.driverBatta || 0;
        const extraDutyCharges = Number(slip.extraDutyCharges) || 0;
        const baseKm = 100;

        let dayTotal = 0;
        const effectiveGarageKm = showGarageInOut ? garageKm : 0;
        if (calcMode === 'both_km_and_overtime') {
          dayTotal = (km * rateKm) + (extraHours * rateOt) + (effectiveGarageKm * rateGarage) + night + parking + toll + batta + extraDutyCharges;
        } else {
          const basePrice = (km > 0 || hours > 0) ? baseKm * rateKm : 0;
          const extraKmCharge = Math.max(0, km - baseKm) * rateKm;
          const extraHourCharge = extraHours * rateOt;
          const highestExtra = Math.max(extraKmCharge, extraHourCharge);
          dayTotal = basePrice + highestExtra + (effectiveGarageKm * rateGarage) + night + parking + toll + batta + extraDutyCharges;
        }

        const isOffDay = km === 0 && (slip.route?.toLowerCase().includes('off') || slip.route?.toLowerCase().includes('garage'));

        if (!isOffDay && (km > 0 || hours > 0 || garageKm > 0 || night > 0 || parking > 0 || toll > 0 || extraDutyCharges > 0)) {
          sumHours += hours;
          sumKm += km;
          sumOt += extraHours;
          sumGarageKm += garageKm;
          sumNight += night;
          sumParking += parking;
          sumToll += toll;
          sumBatta += batta;
          sumExtraDuty += extraDutyCharges;
          sumTotal += dayTotal;

          rows.push({
            date: displayDate,
            dutySlipNo: slip.dutySlipNo,
            startTime: startTime,
            endTime: endTime,
            hours: hours > 0 ? hours : '',
            extraHours: extraHours > 0 ? extraHours : '',
            extraDuty: slip.extraDuty || slip.route || '',
            extraDutyCharges: extraDutyCharges,
            km: km > 0 ? km : '',
            startKm: startKm > 0 ? startKm : '',
            endKm: endKm > 0 ? endKm : '',
            garageOutKm: garageOutDisplay,
            garageInKm: garageInDisplay,
            garageKm: garageKm,
            overtimeCharges: extraHours * rateOt,
            nightCharge: night > 0 ? night : undefined,
            parkingCharge: parking,
            tollCharge: toll,
            driverBatta: batta,
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
      sumParking = mainItem.parkingCharges || 0;
      sumToll = mainItem.tollCharges || 0;
      sumTotal = invoice.netPayable || invoice.grandTotal;
    }

    return {
      rows,
      totalHours: Math.round(sumHours),
      totalKm: sumKm,
      totalOvertimeHours: sumOt,
      totalGarageKm: sumGarageKm,
      totalNight: sumNight,
      totalParking: sumParking,
      totalToll: sumToll,
      totalBatta: sumBatta,
      totalExtraDutyCharges: sumExtraDuty,
      grandTotalAmount: sumTotal || (invoice.netPayable || invoice.grandTotal),
      rateKm,
      rateOt,
      rateGarage,
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
        <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3 no-print">
          
          {/* Format Selection Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-bold uppercase mr-1">Format:</span>
              
              <button
                type="button"
                onClick={() => {
                  setTemplateFormat('bishal-official');
                  setShowOvertimeCol(false);
                  setShowGarageInOut(false);
                  setShowExtraDutyCol(false);
                  setCalcMode('highest_extra');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  templateFormat === 'bishal-official'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span>Official JULU BISHAL (Previous Format)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplateFormat('dual-km-overtime');
                  setShowOvertimeCol(true);
                  setCalcMode('both_km_and_overtime');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  templateFormat === 'dual-km-overtime'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Dual KM & OT + Break-Up (New Structure)</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateFormat('corporate-duty-annexure')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  templateFormat === 'corporate-duty-annexure'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>Corporate Annexure</span>
              </button>

              <button
                type="button"
                onClick={() => setTemplateFormat('executive-summary')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  templateFormat === 'executive-summary'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <span>Executive Summary</span>
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

            {/* Calculation Mode Toggle */}
            {templateFormat !== 'corporate-tax' && (
              <button
                type="button"
                onClick={() => setCalcMode(calcMode === 'both_km_and_overtime' ? 'highest_extra' : 'both_km_and_overtime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  calcMode === 'both_km_and_overtime'
                    ? 'bg-emerald-700/90 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
                title="Toggle dual calculation mode (both KM & Overtime) vs highest extra"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Both KM & OT Calc: {calcMode === 'both_km_and_overtime' ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          {/* Column Toggles & Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {templateFormat !== 'corporate-tax' ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Columns:</span>

                <button
                  type="button"
                  onClick={() => setShowStartEndKm(!showStartEndKm)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showStartEndKm ? 'bg-emerald-800 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Start/End KM: {showStartEndKm ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowStartEndTime(!showStartEndTime)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showStartEndTime ? 'bg-emerald-800 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Start/End Time: {showStartEndTime ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowGarageInOut(!showGarageInOut)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showGarageInOut ? 'bg-blue-800 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Garage In/Out: {showGarageInOut ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowOvertimeCol(!showOvertimeCol)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showOvertimeCol ? 'bg-amber-800 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  OT Col: {showOvertimeCol ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowExtraDutyCol(!showExtraDutyCol)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showExtraDutyCol ? 'bg-purple-800 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Extra Duty (₹): {showExtraDutyCol ? 'ON' : 'OFF'}
                </button>

                <button
                  type="button"
                  onClick={() => setHideTotalPrice(!hideTotalPrice)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    hideTotalPrice ? 'bg-rose-800 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Daily Price: {hideTotalPrice ? 'HIDDEN' : 'VISIBLE'}
                </button>
              </div>
            ) : <div />}

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
        </div>

        {/* Live Document Preview Container */}
        <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-slate-100 p-2 sm:p-4 md:p-6 shadow-inner flex justify-start md:justify-center">
          {/* FORMATS 1-4: BISHAL MULTI-FORMAT TEMPLATES */}
          {templateFormat !== 'corporate-tax' && (
            <BishalMonthlyInvoicePdfTemplate
              company={company}
              vehicle={primaryVehicle}
              monthTitle={invoice.billingMonth || 'JULY 2026'}
              invoiceDateStr={formatDate(invoice.invoiceDate, 'dd-MM-yyyy')}
              rows={bishalReportData.rows}
              totalHours={bishalReportData.totalHours}
              totalKm={bishalReportData.totalKm}
              totalOvertimeHours={bishalReportData.totalOvertimeHours}
              totalGarageKm={bishalReportData.totalGarageKm}
              totalNight={bishalReportData.totalNight}
              totalParking={bishalReportData.totalParking}
              totalToll={bishalReportData.totalToll}
              totalBatta={bishalReportData.totalBatta}
              totalExtraDutyCharges={bishalReportData.totalExtraDutyCharges}
              grandTotalAmount={bishalReportData.grandTotalAmount}
              client={invoice.clientSnapshot}
              elementId="bishal-official-pdf-report"
              showStartEndKm={showStartEndKm}
              showStartEndTime={showStartEndTime}
              showGarageInOut={showGarageInOut}
              showOvertimeCol={showOvertimeCol}
              showExtraDutyCol={showExtraDutyCol}
              hideTotalPrice={hideTotalPrice}
              calcMode={calcMode}
              pdfFormat={templateFormat as any}
              ratePerKm={bishalReportData.rateKm}
              overtimeRatePerHour={bishalReportData.rateOt}
              garageRatePerKm={bishalReportData.rateGarage}
            />
          )}

          {/* FORMAT 5: CORPORATE TAX INVOICE */}
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

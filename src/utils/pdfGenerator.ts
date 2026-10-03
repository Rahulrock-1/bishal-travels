import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Invoice, CompanyProfile, DutySlip, Vehicle, Client } from '../types';
import { formatCurrency, formatDate, formatKm, formatHours, numberToWordsIndian } from './formatters';

export interface PdfDownloadOptions {
  /** If true (default), guarantees that the document fits completely onto ONE single A4 page */
  singlePage?: boolean;
  /** Margin in mm around the printable page (default: 4mm) */
  marginMm?: number;
}

/**
 * Downloads a high-quality PDF of the invoice or monthly statement.
 * Guarantees that single-page invoices fit cleanly onto ONE SINGLE A4 PAGE without breaking or overflowing.
 * For multi-document containers (e.g. Corporate Tax + Annexure), renders each onto its own dedicated clean page.
 */
export async function downloadInvoiceAsPdf(
  elementId: string,
  filename: string,
  options?: PdfDownloadOptions
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  const isSinglePage = options?.singlePage !== false;
  const margin = options?.marginMm ?? 4; // 4mm margin for maximum printable space

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm
    const availWidth = pdfWidth - (margin * 2);
    const availHeight = pdfHeight - (margin * 2);

    // Check if the container holds multiple distinct document pages (e.g. corporate tax invoice + duty annexure)
    const childPages = Array.from(element.children).filter(
      child => child instanceof HTMLElement && (
        child.id.startsWith('invoice-print-doc') ||
        child.id.startsWith('duty-annexure-doc') ||
        child.classList.contains('page-break')
      )
    ) as HTMLElement[];

    const pagesToRender: HTMLElement[] = childPages.length > 1
      ? childPages
      : [element];

    for (let i = 0; i < pagesToRender.length; i++) {
      const pageEl = pagesToRender[i];

      const canvas = await html2canvas(pageEl, {
        scale: 2.2, // 2.2x resolution for razor-sharp text and borders
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        windowHeight: 1600,
        scrollX: 0,
        scrollY: 0,
        onclone: (_clonedDoc, clonedElement) => {
          // Reset outer layout to exact A4 printable width without extraneous padding
          clonedElement.style.width = '794px';
          clonedElement.style.minWidth = '794px';
          clonedElement.style.maxWidth = '794px';
          clonedElement.style.minHeight = 'auto';
          clonedElement.style.margin = '0 auto';
          clonedElement.style.padding = '0';
          clonedElement.style.transform = 'none';
          clonedElement.style.boxSizing = 'border-box';
          clonedElement.style.display = 'block';

          // Ensure table and inner elements don't get squished
          const tables = clonedElement.querySelectorAll('table');
          tables.forEach(table => {
            (table as HTMLElement).style.width = '100%';
            (table as HTMLElement).style.tableLayout = 'auto';
          });

          // Ensure grid columns render in desktop mode
          const grids = clonedElement.querySelectorAll('.grid');
          grids.forEach(grid => {
            (grid as HTMLElement).style.display = 'grid';
          });
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);

      if (i > 0) {
        pdf.addPage();
      }

      if (isSinglePage || pagesToRender.length > 1) {
        // Guarantee fit on ONE single page by scaling proportionally to fit within both width and height bounds
        const scale = Math.min(availWidth / canvas.width, availHeight / canvas.height);
        const finalWidth = canvas.width * scale;
        const finalHeight = canvas.height * scale;

        // Center horizontally, align with top margin
        const posX = margin + (availWidth - finalWidth) / 2;
        const posY = margin;

        pdf.addImage(imgData, 'PNG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');
      } else {
        // Multi-page fallback if singlePage was explicitly set to false
        const contentWidth = availWidth;
        const contentHeight = (canvas.height * contentWidth) / canvas.width;
        let heightLeft = contentHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
        heightLeft -= availHeight;

        while (heightLeft > 5) {
          position = heightLeft - contentHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
          heightLeft -= availHeight;
        }
      }
    }

    const cleanFilename = `${filename.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

/**
 * Triggers native browser print dialog for the invoice element
 */
export function triggerPrint(): void {
  window.print();
}

/**
 * Exports duty slips data as CSV format
 */
export function exportDutySlipsCsv(dutySlips: DutySlip[], vehicles: Vehicle[], clients: Client[]): void {
  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
  const clientMap = new Map(clients.map(c => [c.id, c]));

  const headers = [
    'Duty Slip No',
    'Date',
    'Vehicle Reg No',
    'Vehicle Model',
    'Client / Company',
    'Driver Name',
    'Route / Purpose',
    'Start KM',
    'End KM',
    'Total KM',
    'Start Time',
    'End Time',
    'Total Hours',
    'Extra Hours',
    'Night Charges (₹)',
    'Parking Charges (₹)',
    'Toll Charges (₹)',
    'Driver Batta (₹)',
    'Other Charges (₹)',
    'Status'
  ];

  const rows = dutySlips.map(ds => {
    const veh = vehicleMap.get(ds.vehicleId);
    const cli = clientMap.get(ds.clientId);
    return [
      `"${ds.dutySlipNo}"`,
      `"${ds.date}"`,
      `"${veh?.regNumber || ''}"`,
      `"${veh?.model || ''}"`,
      `"${cli?.companyName || cli?.name || ''}"`,
      `"${ds.driverName}"`,
      `"${(ds.route || '').replace(/"/g, '""')}"`,
      ds.startKm,
      ds.endKm,
      ds.totalKm,
      `"${ds.startTime}"`,
      `"${ds.endTime}"`,
      ds.totalHours,
      ds.extraHours,
      ds.nightCharges,
      ds.parkingCharges,
      ds.tollCharges,
      ds.driverBatta,
      ds.otherExpenses,
      `"${ds.status}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bishal_Travels_Duty_Slips_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

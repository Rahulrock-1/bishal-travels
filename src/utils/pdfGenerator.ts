import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Invoice, CompanyProfile, DutySlip, Vehicle, Client } from '../types';
import { formatCurrency, formatDate, formatKm, formatHours, numberToWordsIndian } from './formatters';

/**
 * Downloads a high-quality PDF of the invoice by rendering the DOM element via html2canvas & jsPDF.
 * Configured with fixed A4 dimensions and desktop-grade onclone overrides to ensure 100% perfect
 * formatting on mobile phones, tablets, and desktops.
 */
export async function downloadInvoiceAsPdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Render high quality canvas with fixed desktop width regardless of mobile device viewport
    const canvas = await html2canvas(element, {
      scale: 2, // 2x high resolution clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      windowHeight: 1600,
      scrollX: 0,
      scrollY: 0,
      onclone: (_clonedDoc, clonedElement) => {
        // Enforce fixed desktop A4 printable layout on cloned element
        clonedElement.style.width = '794px';
        clonedElement.style.minWidth = '794px';
        clonedElement.style.maxWidth = '794px';
        clonedElement.style.margin = '0 auto';
        clonedElement.style.padding = '16px';
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
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Fit image to full A4 page width with minimal margins
    const margin = 5; // 5mm margin
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
    heightLeft -= (pdfHeight - (margin * 2));

    // Subsequent pages if content overflows A4
    while (heightLeft > 5) {
      position = heightLeft - contentHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, undefined, 'FAST');
      heightLeft -= (pdfHeight - (margin * 2));
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

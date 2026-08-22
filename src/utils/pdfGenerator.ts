import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Invoice, CompanyProfile, DutySlip, Vehicle, Client } from '../types';
import { formatCurrency, formatDate, formatKm, formatHours, numberToWordsIndian } from './formatters';

/**
 * Downloads a high-quality PDF of the invoice by rendering the DOM element via html2canvas & jsPDF
 */
export async function downloadInvoiceAsPdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    // Temporarily ensure background is white and scale is high for crisp vector quality
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Subsequent pages if content overflows A4
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
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

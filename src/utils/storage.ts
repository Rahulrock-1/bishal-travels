import { CompanyProfile, Vehicle, Client, DutySlip, Invoice } from '../types';
import { initialCompanyProfile, sampleVehicles, sampleClients, sampleDutySlips, sampleInvoices } from '../data/sampleData';

const KEYS = {
  COMPANY: 'bt_company_profile',
  VEHICLES: 'bt_vehicles',
  CLIENTS: 'bt_clients',
  DUTY_SLIPS: 'bt_duty_slips',
  INVOICES: 'bt_invoices',
  SETUP_COMPLETED: 'bt_setup_completed'
};

export interface AppStateData {
  company: CompanyProfile;
  vehicles: Vehicle[];
  clients: Client[];
  dutySlips: DutySlip[];
  invoices: Invoice[];
  setupCompleted: boolean;
}

export function loadInitialData(): AppStateData {
  try {
    const rawCompany = localStorage.getItem(KEYS.COMPANY);
    const rawVehicles = localStorage.getItem(KEYS.VEHICLES);
    const rawClients = localStorage.getItem(KEYS.CLIENTS);
    const rawDutySlips = localStorage.getItem(KEYS.DUTY_SLIPS);
    const rawInvoices = localStorage.getItem(KEYS.INVOICES);
    const rawSetup = localStorage.getItem(KEYS.SETUP_COMPLETED);

    return {
      company: rawCompany ? JSON.parse(rawCompany) : initialCompanyProfile,
      vehicles: rawVehicles ? JSON.parse(rawVehicles) : sampleVehicles,
      clients: rawClients ? JSON.parse(rawClients) : sampleClients,
      dutySlips: rawDutySlips ? JSON.parse(rawDutySlips) : sampleDutySlips,
      invoices: rawInvoices ? JSON.parse(rawInvoices) : sampleInvoices,
      setupCompleted: rawSetup ? JSON.parse(rawSetup) : true,
    };
  } catch (err) {
    console.error('Error loading data from localStorage:', err);
    return {
      company: initialCompanyProfile,
      vehicles: sampleVehicles,
      clients: sampleClients,
      dutySlips: sampleDutySlips,
      invoices: sampleInvoices,
      setupCompleted: true,
    };
  }
}

export function saveDataToStorage(data: Partial<AppStateData>): void {
  try {
    if (data.company !== undefined) localStorage.setItem(KEYS.COMPANY, JSON.stringify(data.company));
    if (data.vehicles !== undefined) localStorage.setItem(KEYS.VEHICLES, JSON.stringify(data.vehicles));
    if (data.clients !== undefined) localStorage.setItem(KEYS.CLIENTS, JSON.stringify(data.clients));
    if (data.dutySlips !== undefined) localStorage.setItem(KEYS.DUTY_SLIPS, JSON.stringify(data.dutySlips));
    if (data.invoices !== undefined) localStorage.setItem(KEYS.INVOICES, JSON.stringify(data.invoices));
    if (data.setupCompleted !== undefined) localStorage.setItem(KEYS.SETUP_COMPLETED, JSON.stringify(data.setupCompleted));
  } catch (err) {
    console.error('Error writing data to localStorage:', err);
  }
}

/**
 * Exports all system data as a JSON file backup
 */
export function exportBackupJson(state: AppStateData): void {
  const dataStr = JSON.stringify({
    appName: 'BISHAL TRAVELS Invoice System',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: state
  }, null, 2);

  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bishal_Travels_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse uploaded JSON backup
 */
export async function parseBackupFile(file: File): Promise<AppStateData | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (parsed && parsed.data && parsed.data.company) {
      return parsed.data as AppStateData;
    }
    if (parsed && parsed.company) {
      return parsed as AppStateData;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse backup file:', err);
    return null;
  }
}

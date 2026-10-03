import { 
  CompanyProfile, 
  Vehicle, 
  Client, 
  DutySlip, 
  Invoice, 
  InvoiceStatus 
} from '../types';
import { AppStateData } from '../utils/storage';
import { clientProxy } from './clientProxy';

const API_BASE_URL = clientProxy.getBaseUrl();

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  return clientProxy.request<T>(url, options);
}

export const api = {
  baseUrl: API_BASE_URL,

  // Health check
  async checkHealth(): Promise<{ status: string; service: string; database: string }> {
    const healthUrl = `${API_BASE_URL}/health`;
    const res = await fetch(healthUrl);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // Auth
  auth: {
    login: (email: string, password: string) => 
      fetchJson<{ success: boolean; error?: string; user?: any; token?: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    me: () => fetchJson<{ name: string; email: string; role: string }>('/auth/me')
  },

  // Company Profile & Bank Details
  company: {
    get: () => fetchJson<CompanyProfile>('/company'),
    update: (profile: Partial<CompanyProfile>) => 
      fetchJson<CompanyProfile>('/company', {
        method: 'PUT',
        body: JSON.stringify(profile)
      })
  },

  // Vehicles Fleet
  vehicles: {
    getAll: () => fetchJson<Vehicle[]>('/vehicles'),
    getById: (id: string) => fetchJson<Vehicle>(`/vehicles/${id}`),
    create: (vehicle: Omit<Vehicle, 'id'>) => 
      fetchJson<Vehicle>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicle)
      }),
    update: (id: string, vehicle: Partial<Vehicle>) => 
      fetchJson<Vehicle>(`/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehicle)
      }),
    delete: (id: string) => 
      fetchJson<void>(`/vehicles/${id}`, { method: 'DELETE' })
  },

  // Clients
  clients: {
    getAll: () => fetchJson<Client[]>('/clients'),
    getById: (id: string) => fetchJson<Client>(`/clients/${id}`),
    create: (client: Omit<Client, 'id'>) => 
      fetchJson<Client>('/clients', {
        method: 'POST',
        body: JSON.stringify(client)
      }),
    update: (id: string, client: Partial<Client>) => 
      fetchJson<Client>(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(client)
      }),
    delete: (id: string) => 
      fetchJson<void>(`/clients/${id}`, { method: 'DELETE' })
  },

  // Duty Slips
  dutySlips: {
    getAll: (params?: { status?: string; clientId?: string; vehicleId?: string }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.clientId) search.set('clientId', params.clientId);
      if (params?.vehicleId) search.set('vehicleId', params.vehicleId);
      const query = search.toString() ? `?${search.toString()}` : '';
      return fetchJson<DutySlip[]>(`/dutyslips${query}`);
    },
    getUnbilled: (clientId?: string, vehicleId?: string) => {
      const search = new URLSearchParams();
      if (clientId) search.set('clientId', clientId);
      if (vehicleId) search.set('vehicleId', vehicleId);
      const query = search.toString() ? `?${search.toString()}` : '';
      return fetchJson<DutySlip[]>(`/dutyslips/unbilled${query}`);
    },
    getById: (id: string) => fetchJson<DutySlip>(`/dutyslips/${id}`),
    create: (dutySlip: Omit<DutySlip, 'id' | 'status'>) => 
      fetchJson<DutySlip>('/dutyslips', {
        method: 'POST',
        body: JSON.stringify(dutySlip)
      }),
    upsert: (dutySlip: Partial<DutySlip> & { dutySlipNo: string; date: string; vehicleId: string; clientId: string }) => 
      fetchJson<DutySlip>('/dutyslips/upsert', {
        method: 'POST',
        body: JSON.stringify(dutySlip)
      }),
    batchUpsert: (dutySlips: (Partial<DutySlip> & { dutySlipNo: string; date: string; vehicleId: string; clientId: string })[]) => 
      fetchJson<DutySlip[]>('/dutyslips/batch-upsert', {
        method: 'POST',
        body: JSON.stringify(dutySlips)
      }),
    update: (id: string, dutySlip: Partial<DutySlip>) => 
      fetchJson<DutySlip>(`/dutyslips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dutySlip)
      }),
    delete: (id: string) => 
      fetchJson<void>(`/dutyslips/${id}`, { method: 'DELETE' })
  },

  // Invoices
  invoices: {
    getAll: (params?: { status?: string; month?: string; clientId?: string }) => {
      const search = new URLSearchParams();
      if (params?.status) search.set('status', params.status);
      if (params?.month) search.set('month', params.month);
      if (params?.clientId) search.set('clientId', params.clientId);
      const query = search.toString() ? `?${search.toString()}` : '';
      return fetchJson<Invoice[]>(`/invoices${query}`);
    },
    getById: (id: string) => fetchJson<Invoice>(`/invoices/${id}`),
    create: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => 
      fetchJson<Invoice>('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoice)
      }),
    update: (id: string, invoice: Partial<Invoice>) => 
      fetchJson<Invoice>(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoice)
      }),
    updateStatus: (id: string, status: InvoiceStatus) => 
      fetchJson<void>(`/invoices/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    delete: (id: string) => 
      fetchJson<void>(`/invoices/${id}`, { method: 'DELETE' })
  },

  // Reports
  reports: {
    getMonthly: (month?: string) => {
      const query = month ? `?month=${encodeURIComponent(month)}` : '';
      return fetchJson<any>(`/reports/monthly${query}`);
    }
  },

  // Backup & Reset
  backup: {
    export: () => fetchJson<AppStateData>('/backup/export'),
    restore: (data: AppStateData) => 
      fetchJson<{ message: string }>('/backup/restore', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    reset: () => 
      fetchJson<{ message: string }>('/backup/reset', {
        method: 'POST'
      })
  },

  // Server-Side Proxy
  proxy: {
    forward: (targetUrl: string) => 
      fetchJson<any>(`/proxy/forward?targetUrl=${encodeURIComponent(targetUrl)}`),
    getStatus: () => 
      fetchJson<{ proxy: string; status: string; forwardedFor?: string; forwardedProto?: string; whitelistedHosts?: string[] }>('/proxy/status')
  }
};

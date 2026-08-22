import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CompanyProfile, 
  Vehicle, 
  Client, 
  DutySlip, 
  Invoice, 
  ActiveTab, 
  InvoiceStatus 
} from '../types';
import { loadInitialData, saveDataToStorage, AppStateData } from '../utils/storage';
import { initialCompanyProfile, sampleVehicles, sampleClients, sampleDutySlips, sampleInvoices } from '../data/sampleData';

interface AppContextType {
  company: CompanyProfile;
  updateCompany: (profile: Partial<CompanyProfile>) => void;
  
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Client;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  dutySlips: DutySlip[];
  addDutySlip: (dutySlip: Omit<DutySlip, 'id' | 'status'>) => DutySlip;
  updateDutySlip: (id: string, dutySlip: Partial<DutySlip>) => void;
  deleteDutySlip: (id: string) => void;
  
  invoices: Invoice[];
  createInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  
  selectedInvoiceForView: Invoice | null;
  setSelectedInvoiceForView: (invoice: Invoice | null) => void;
  
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;

  restoreState: (data: AppStateData) => void;
  resetToSampleData: () => void;
  getAllState: () => AppStateData;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppStateData>(loadInitialData);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Sync to storage on state change
  useEffect(() => {
    saveDataToStorage(data);
  }, [data]);

  const updateCompany = (profile: Partial<CompanyProfile>) => {
    setData(prev => ({
      ...prev,
      company: { ...prev.company, ...profile, isConfigured: true }
    }));
  };

  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: `veh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setData(prev => ({
      ...prev,
      vehicles: [newVehicle, ...prev.vehicles]
    }));
    return newVehicle;
  };

  const updateVehicle = (id: string, vehicleData: Partial<Vehicle>) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...vehicleData } : v)
    }));
  };

  const deleteVehicle = (id: string) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id)
    }));
  };

  const addClient = (clientData: Omit<Client, 'id'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setData(prev => ({
      ...prev,
      clients: [newClient, ...prev.clients]
    }));
    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...clientData } : c)
    }));
  };

  const deleteClient = (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id)
    }));
  };

  const addDutySlip = (dutyData: Omit<DutySlip, 'id' | 'status'>): DutySlip => {
    const newDutySlip: DutySlip = {
      ...dutyData,
      id: `ds-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'Pending'
    };
    setData(prev => ({
      ...prev,
      dutySlips: [newDutySlip, ...prev.dutySlips]
    }));
    return newDutySlip;
  };

  const updateDutySlip = (id: string, dutyData: Partial<DutySlip>) => {
    setData(prev => ({
      ...prev,
      dutySlips: prev.dutySlips.map(ds => ds.id === id ? { ...ds, ...dutyData } : ds)
    }));
  };

  const deleteDutySlip = (id: string) => {
    setData(prev => ({
      ...prev,
      dutySlips: prev.dutySlips.filter(ds => ds.id !== id)
    }));
  };

  const createInvoice = (invData: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };

    // Mark attached duty slips as billed
    const attachedIds = new Set(newInvoice.attachedDutySlipIds || []);

    setData(prev => ({
      ...prev,
      invoices: [newInvoice, ...prev.invoices],
      dutySlips: prev.dutySlips.map(ds => 
        attachedIds.has(ds.id) 
          ? { ...ds, status: 'Billed', invoiceId: newInvoice.id } 
          : ds
      )
    }));
    return newInvoice;
  };

  const updateInvoice = (id: string, invData: Partial<Invoice>) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, ...invData } : inv)
    }));
  };

  const deleteInvoice = (id: string) => {
    setData(prev => {
      // Unlink billed duty slips for this invoice
      const updatedDutySlips = prev.dutySlips.map(ds => 
        ds.invoiceId === id ? { ...ds, status: 'Pending' as const, invoiceId: undefined } : ds
      );
      return {
        ...prev,
        invoices: prev.invoices.filter(inv => inv.id !== id),
        dutySlips: updatedDutySlips
      };
    });
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    }));
  };

  const restoreState = (restored: AppStateData) => {
    setData(restored);
  };

  const resetToSampleData = () => {
    const fresh: AppStateData = {
      company: initialCompanyProfile,
      vehicles: sampleVehicles,
      clients: sampleClients,
      dutySlips: sampleDutySlips,
      invoices: sampleInvoices,
      setupCompleted: true
    };
    setData(fresh);
    saveDataToStorage(fresh);
  };

  const getAllState = (): AppStateData => data;

  return (
    <AppContext.Provider value={{
      company: data.company,
      updateCompany,
      vehicles: data.vehicles,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      clients: data.clients,
      addClient,
      updateClient,
      deleteClient,
      dutySlips: data.dutySlips,
      addDutySlip,
      updateDutySlip,
      deleteDutySlip,
      invoices: data.invoices,
      createInvoice,
      updateInvoice,
      deleteInvoice,
      updateInvoiceStatus,
      activeTab,
      setActiveTab,
      selectedInvoiceForView,
      setSelectedInvoiceForView,
      isSettingsModalOpen,
      setIsSettingsModalOpen,
      restoreState,
      resetToSampleData,
      getAllState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

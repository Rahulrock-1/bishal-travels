import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { api } from '../services/api';

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

  // Cloud & Sync States
  isCloudConnected: boolean;
  isLoadingFromCloud: boolean;
  refreshFromCloud: () => Promise<void>;

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
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isLoadingFromCloud, setIsLoadingFromCloud] = useState<boolean>(false);

  // Sync to local storage on state change as persistent fallback
  useEffect(() => {
    saveDataToStorage(data);
  }, [data]);

  // Cloud fetch on mount and on auth change
  const refreshFromCloud = useCallback(async () => {
    setIsLoadingFromCloud(true);
    try {
      // Parallel fetch from .NET Web API
      const [cloudCompany, cloudVehicles, cloudClients, cloudDutySlips, cloudInvoices] = await Promise.all([
        api.company.get().catch(() => null),
        api.vehicles.getAll().catch(() => null),
        api.clients.getAll().catch(() => null),
        api.dutySlips.getAll().catch(() => null),
        api.invoices.getAll().catch(() => null)
      ]);

      if (cloudCompany) {
        setData(prev => ({
          ...prev,
          company: cloudCompany,
          vehicles: cloudVehicles ?? prev.vehicles,
          clients: cloudClients ?? prev.clients,
          dutySlips: cloudDutySlips ?? prev.dutySlips,
          invoices: cloudInvoices ?? prev.invoices,
          setupCompleted: true
        }));
        setIsCloudConnected(true);
      } else {
        setIsCloudConnected(false);
      }
    } catch (err) {
      console.warn('API currently unreachable, using LocalStorage state:', err);
      setIsCloudConnected(false);
    } finally {
      setIsLoadingFromCloud(false);
    }
  }, []);

  useEffect(() => {
    refreshFromCloud();

    const onAuthLogin = () => {
      refreshFromCloud();
    };

    window.addEventListener('auth:login', onAuthLogin);
    return () => window.removeEventListener('auth:login', onAuthLogin);
  }, [refreshFromCloud]);

  const updateCompany = (profile: Partial<CompanyProfile>) => {
    const updatedCompany = { ...data.company, ...profile, isConfigured: true };
    setData(prev => ({
      ...prev,
      company: updatedCompany
    }));

    if (isCloudConnected) {
      api.company.update(updatedCompany).catch(err => {
        console.error('Failed to sync company profile to cloud:', err);
      });
    }
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

    if (isCloudConnected) {
      api.vehicles.create(vehicleData)
        .then(created => {
          if (created && created.id) {
            setData(prev => ({
              ...prev,
              vehicles: prev.vehicles.map(v => v.id === newVehicle.id ? created : v)
            }));
          }
        })
        .catch(err => console.error('Failed to add vehicle to cloud:', err));
    }

    return newVehicle;
  };

  const updateVehicle = (id: string, vehicleData: Partial<Vehicle>) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === id ? { ...v, ...vehicleData } : v)
    }));

    if (isCloudConnected) {
      api.vehicles.update(id, vehicleData).catch(err => {
        console.error('Failed to update vehicle on cloud:', err);
      });
    }
  };

  const deleteVehicle = (id: string) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id)
    }));

    if (isCloudConnected) {
      api.vehicles.delete(id).catch(err => {
        console.error('Failed to delete vehicle on cloud:', err);
      });
    }
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

    if (isCloudConnected) {
      api.clients.create(clientData)
        .then(created => {
          if (created && created.id) {
            setData(prev => ({
              ...prev,
              clients: prev.clients.map(c => c.id === newClient.id ? created : c)
            }));
          }
        })
        .catch(err => console.error('Failed to add client to cloud:', err));
    }

    return newClient;
  };

  const updateClient = (id: string, clientData: Partial<Client>) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === id ? { ...c, ...clientData } : c)
    }));

    if (isCloudConnected) {
      api.clients.update(id, clientData).catch(err => {
        console.error('Failed to update client on cloud:', err);
      });
    }
  };

  const deleteClient = (id: string) => {
    setData(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id)
    }));

    if (isCloudConnected) {
      api.clients.delete(id).catch(err => {
        console.error('Failed to delete client on cloud:', err);
      });
    }
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

    if (isCloudConnected) {
      api.dutySlips.create(dutyData)
        .then(created => {
          if (created && created.id) {
            setData(prev => ({
              ...prev,
              dutySlips: prev.dutySlips.map(ds => ds.id === newDutySlip.id ? created : ds)
            }));
          }
        })
        .catch(err => console.error('Failed to add duty slip to cloud:', err));
    }

    return newDutySlip;
  };

  const updateDutySlip = (id: string, dutyData: Partial<DutySlip>) => {
    setData(prev => ({
      ...prev,
      dutySlips: prev.dutySlips.map(ds => ds.id === id ? { ...ds, ...dutyData } : ds)
    }));

    if (isCloudConnected) {
      api.dutySlips.update(id, dutyData).catch(err => {
        console.error('Failed to update duty slip on cloud:', err);
      });
    }
  };

  const deleteDutySlip = (id: string) => {
    setData(prev => ({
      ...prev,
      dutySlips: prev.dutySlips.filter(ds => ds.id !== id)
    }));

    if (isCloudConnected) {
      api.dutySlips.delete(id).catch(err => {
        console.error('Failed to delete duty slip on cloud:', err);
      });
    }
  };

  const createInvoice = (invData: Omit<Invoice, 'id' | 'createdAt'>): Invoice => {
    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString()
    };

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

    if (isCloudConnected) {
      api.invoices.create(invData)
        .then(created => {
          if (created && created.id) {
            setData(prev => ({
              ...prev,
              invoices: prev.invoices.map(i => i.id === newInvoice.id ? created : i),
              dutySlips: prev.dutySlips.map(ds => 
                attachedIds.has(ds.id) 
                  ? { ...ds, status: 'Billed', invoiceId: created.id } 
                  : ds
              )
            }));
          }
        })
        .catch(err => console.error('Failed to create invoice on cloud:', err));
    }

    return newInvoice;
  };

  const updateInvoice = (id: string, invData: Partial<Invoice>) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, ...invData } : inv)
    }));

    if (isCloudConnected) {
      api.invoices.update(id, invData).catch(err => {
        console.error('Failed to update invoice on cloud:', err);
      });
    }
  };

  const deleteInvoice = (id: string) => {
    setData(prev => {
      const updatedDutySlips = prev.dutySlips.map(ds => 
        ds.invoiceId === id ? { ...ds, status: 'Pending' as const, invoiceId: undefined } : ds
      );
      return {
        ...prev,
        invoices: prev.invoices.filter(inv => inv.id !== id),
        dutySlips: updatedDutySlips
      };
    });

    if (isCloudConnected) {
      api.invoices.delete(id).catch(err => {
        console.error('Failed to delete invoice on cloud:', err);
      });
    }
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status } : inv)
    }));

    if (isCloudConnected) {
      api.invoices.updateStatus(id, status).catch(err => {
        console.error('Failed to update invoice status on cloud:', err);
      });
    }
  };

  const restoreState = (restored: AppStateData) => {
    setData(restored);
    if (isCloudConnected) {
      api.backup.restore(restored).catch(err => {
        console.error('Failed to restore backup to cloud:', err);
      });
    }
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

    if (isCloudConnected) {
      api.backup.reset().catch(err => {
        console.error('Failed to reset cloud database:', err);
      });
    }
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
      isCloudConnected,
      isLoadingFromCloud,
      refreshFromCloud,
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

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
  upsertDutySlip: (dutySlip: Partial<DutySlip> & { dutySlipNo: string; date: string; vehicleId: string; clientId: string }) => Promise<DutySlip>;
  batchUpsertDutySlips: (dutySlips: (Partial<DutySlip> & { dutySlipNo: string; date: string; vehicleId: string; clientId: string })[]) => Promise<DutySlip[]>;
  
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

const DUTYSLIP_OUTBOX_KEY = 'bishal_travels_dutyslip_outbox';

function getOfflineDutySlips(): any[] {
  try {
    const raw = localStorage.getItem(DUTYSLIP_OUTBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function queueOfflineDutySlip(slip: any) {
  try {
    const list = getOfflineDutySlips();
    const filtered = list.filter(item => 
      item.id !== slip.id && !(item.vehicleId === slip.vehicleId && item.date === slip.date)
    );
    filtered.push(slip);
    localStorage.setItem(DUTYSLIP_OUTBOX_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

async function flushOfflineDutySlips(onSuccess?: (synced: DutySlip[]) => void) {
  try {
    const list = getOfflineDutySlips();
    if (!list || list.length === 0) return;
    const synced = await api.dutySlips.batchUpsert(list);
    if (synced && synced.length > 0) {
      localStorage.removeItem(DUTYSLIP_OUTBOX_KEY);
      if (onSuccess) onSuccess(synced);
    }
  } catch {
    // will retry
  }
}

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
        // Fallback: check public health endpoint
        try {
          const health = await api.checkHealth();
          if (health && (health.status === 'Healthy' || health.status === 'Degraded')) {
            setIsCloudConnected(true);
          } else {
            setIsCloudConnected(false);
          }
        } catch {
          setIsCloudConnected(false);
        }
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
      flushOfflineDutySlips(synced => {
        setData(prev => {
          const map = new Map(synced.map(s => [s.id, s]));
          return {
            ...prev,
            dutySlips: prev.dutySlips.map(ds => map.get(ds.id) || ds)
          };
        });
      });
    };

    window.addEventListener('auth:login', onAuthLogin);

    // Auto-reconnect polling every 12s if currently disconnected + flush outbox
    const retryTimer = setInterval(() => {
      if (!isCloudConnected) {
        refreshFromCloud();
      }
      flushOfflineDutySlips(synced => {
        setData(prev => {
          const map = new Map(synced.map(s => [s.id, s]));
          return {
            ...prev,
            dutySlips: prev.dutySlips.map(ds => map.get(ds.id) || ds)
          };
        });
      });
    }, 12000);

    return () => {
      window.removeEventListener('auth:login', onAuthLogin);
      clearInterval(retryTimer);
    };
  }, [refreshFromCloud, isCloudConnected]);

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

  const upsertDutySlip = async (dutyData: Partial<DutySlip> & { dutySlipNo: string; date: string; vehicleId: string; clientId: string }): Promise<DutySlip> => {
    const tempId = dutyData.id || `ds-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const optimisticSlip: DutySlip = {
      id: tempId,
      dutySlipNo: dutyData.dutySlipNo,
      date: dutyData.date,
      vehicleId: dutyData.vehicleId,
      clientId: dutyData.clientId,
      route: dutyData.route || 'Local Duty',
      driverName: dutyData.driverName || 'Driver',
      startKm: dutyData.startKm || 0,
      endKm: dutyData.endKm || 0,
      totalKm: dutyData.totalKm || Math.max(0, (dutyData.endKm || 0) - (dutyData.startKm || 0)),
      garageOutKm: dutyData.garageOutKm,
      garageInKm: dutyData.garageInKm,
      garageKm: dutyData.garageKm,
      startTime: dutyData.startTime || '08:30',
      endTime: dutyData.endTime || '18:30',
      totalHours: dutyData.totalHours || 10,
      extraHours: dutyData.extraHours || 0,
      extraDuty: dutyData.extraDuty,
      extraDutyCharges: dutyData.extraDutyCharges || 0,
      nightCharges: dutyData.nightCharges || 0,
      parkingCharges: dutyData.parkingCharges || 0,
      tollCharges: dutyData.tollCharges || 0,
      driverBatta: dutyData.driverBatta || 0,
      fuelCharges: dutyData.fuelCharges || 0,
      otherExpenses: dutyData.otherExpenses || 0,
      notes: dutyData.notes || '',
      status: dutyData.status || 'Pending'
    };

    // 1. Instant local state update
    setData(prev => {
      const idx = prev.dutySlips.findIndex(ds => 
        (dutyData.id && ds.id === dutyData.id) ||
        (ds.vehicleId === dutyData.vehicleId && ds.date === dutyData.date) ||
        (ds.dutySlipNo && ds.dutySlipNo.toUpperCase() === dutyData.dutySlipNo.toUpperCase())
      );
      if (idx >= 0) {
        const copy = [...prev.dutySlips];
        copy[idx] = { ...copy[idx], ...optimisticSlip, id: copy[idx].id };
        return { ...prev, dutySlips: copy };
      }
      return { ...prev, dutySlips: [optimisticSlip, ...prev.dutySlips] };
    });

    // 2. Real-time Database Persistence
    try {
      const saved = await api.dutySlips.upsert(dutyData);
      if (saved && saved.id) {
        setData(prev => ({
          ...prev,
          dutySlips: prev.dutySlips.map(ds => 
            (ds.id === tempId || ds.id === saved.id || (ds.vehicleId === saved.vehicleId && ds.date === saved.date))
              ? saved 
              : ds
          )
        }));
        setIsCloudConnected(true);
        return saved;
      }
    } catch (err) {
      console.warn('[Realtime Auto-Save]: Saved locally, queued for database sync:', err);
      queueOfflineDutySlip(optimisticSlip);
    }

    return optimisticSlip;
  };

  const batchUpsertDutySlips = async (slips: (Partial<DutySlip> & { dutySlipNo: string; date: string; vehicleId: string; clientId: string })[]): Promise<DutySlip[]> => {
    if (!slips || slips.length === 0) return [];

    // Optimistic local state update
    setData(prev => {
      let currentSlips = [...prev.dutySlips];
      slips.forEach(s => {
        const idx = currentSlips.findIndex(ds => 
          (s.id && ds.id === s.id) || 
          (ds.vehicleId === s.vehicleId && ds.date === s.date)
        );
        const fullSlip: DutySlip = {
          id: s.id || `ds-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          dutySlipNo: s.dutySlipNo,
          date: s.date,
          vehicleId: s.vehicleId,
          clientId: s.clientId,
          route: s.route || 'Local Duty',
          driverName: s.driverName || 'Driver',
          startKm: s.startKm || 0,
          endKm: s.endKm || 0,
          totalKm: s.totalKm || 0,
          garageOutKm: s.garageOutKm,
          garageInKm: s.garageInKm,
          garageKm: s.garageKm,
          startTime: s.startTime || '08:30',
          endTime: s.endTime || '18:30',
          totalHours: s.totalHours || 10,
          extraHours: s.extraHours || 0,
          extraDuty: s.extraDuty,
          extraDutyCharges: s.extraDutyCharges || 0,
          nightCharges: s.nightCharges || 0,
          parkingCharges: s.parkingCharges || 0,
          tollCharges: s.tollCharges || 0,
          driverBatta: s.driverBatta || 0,
          fuelCharges: s.fuelCharges || 0,
          otherExpenses: s.otherExpenses || 0,
          notes: s.notes || '',
          status: s.status || 'Pending'
        };

        if (idx >= 0) {
          currentSlips[idx] = { ...currentSlips[idx], ...fullSlip, id: currentSlips[idx].id };
        } else {
          currentSlips.unshift(fullSlip);
        }
      });
      return { ...prev, dutySlips: currentSlips };
    });

    // Realtime Database save
    try {
      const savedList = await api.dutySlips.batchUpsert(slips);
      if (savedList && savedList.length > 0) {
        setData(prev => {
          const idMap = new Map(savedList.map(s => [s.id, s]));
          const vdMap = new Map(savedList.map(s => [`${s.vehicleId}_${s.date}`, s]));
          return {
            ...prev,
            dutySlips: prev.dutySlips.map(ds => {
              if (idMap.has(ds.id)) return idMap.get(ds.id)!;
              const key = `${ds.vehicleId}_${ds.date}`;
              if (vdMap.has(key)) return vdMap.get(key)!;
              return ds;
            })
          };
        });
        setIsCloudConnected(true);
        return savedList;
      }
    } catch (err) {
      console.warn('[Realtime Batch Auto-Save]: Queued for database sync:', err);
      slips.forEach(s => queueOfflineDutySlip(s));
    }

    return slips as any;
  };

  const addDutySlip = (dutyData: Omit<DutySlip, 'id' | 'status'>): DutySlip => {
    const newDutySlip: DutySlip = {
      ...dutyData,
      id: `ds-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'Pending'
    };
    upsertDutySlip(newDutySlip);
    return newDutySlip;
  };

  const updateDutySlip = (id: string, dutyData: Partial<DutySlip>) => {
    const existing = data.dutySlips.find(ds => ds.id === id);
    if (existing) {
      upsertDutySlip({ ...existing, ...dutyData, id });
    } else {
      setData(prev => ({
        ...prev,
        dutySlips: prev.dutySlips.map(ds => ds.id === id ? { ...ds, ...dutyData } : ds)
      }));
      api.dutySlips.update(id, dutyData).catch(() => {});
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
      upsertDutySlip,
      batchUpsertDutySlips,
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

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { InvoiceList } from './components/invoices/InvoiceList';
import { InvoiceGenerator } from './components/invoices/InvoiceGenerator';
import { DutySlipList } from './components/dutyslips/DutySlipList';
import { VehicleList } from './components/vehicles/VehicleList';
import { ClientList } from './components/clients/ClientList';
import { MonthlyReportView } from './components/reports/MonthlyReportView';
import { SettingsModal } from './components/settings/SettingsModal';
import { InvoiceViewModal } from './components/invoices/InvoiceViewModal';

const MainLayout: React.FC = () => {
  const { activeTab, company } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Main Content Area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <DashboardOverview />}
        {activeTab === 'invoices' && <InvoiceList />}
        {activeTab === 'create-invoice' && <InvoiceGenerator />}
        {activeTab === 'duty-slips' && <DutySlipList />}
        {activeTab === 'vehicles' && <VehicleList />}
        {activeTab === 'clients' && <ClientList />}
        {activeTab === 'reports' && <MonthlyReportView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{company.businessName || 'BISHAL TRAVELS'}</span>
            <span>•</span>
            <span>Trade License: <strong className="font-mono text-slate-700">{company.tradeLicenseNo}</strong></span>
          </div>
          <div>
            Car Run & Monthly Travel Invoicing System • Bank IFSC: <span className="font-mono font-bold text-emerald-800">{company.ifscCode}</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SettingsModal />
      <InvoiceViewModal />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;

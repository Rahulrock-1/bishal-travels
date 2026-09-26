import React from 'react';
import { 
  Car, 
  FileText, 
  PlusCircle, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Building2,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ActiveTab } from '../../types';

interface NavbarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { 
    company, 
    activeTab, 
    setActiveTab, 
    setIsSettingsModalOpen,
    isCloudConnected,
    isLoadingFromCloud,
    refreshFromCloud
  } = useApp();
  const { user, logout } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'create-invoice', label: 'Generate Invoice', icon: PlusCircle },
    { id: 'duty-slips', label: 'Car Run / Duty Log', icon: ClipboardList },
    { id: 'vehicles', label: 'Fleet & Cars', icon: Car },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Monthly Reports', icon: Building2 },
  ];

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
                  {company.businessName || 'BISHAL TRAVELS'}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-400 block -mt-0.5">
                  Monthly Fleet Billing & Invoicing
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings & Profile Trigger */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Cloud API & Database Status Pill */}
            <button
              onClick={() => refreshFromCloud()}
              disabled={isLoadingFromCloud}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isCloudConnected 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60' 
                  : 'bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
              }`}
              title={isCloudConnected ? "Connected to .NET Web API & Supabase PostgreSQL (Click to sync)" : "Running in Offline / LocalStorage Mode (Click to retry cloud connection)"}
            >
              {isLoadingFromCloud ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isCloudConnected ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              )}
              <span className="hidden xl:inline text-[11px] font-semibold">
                {isLoadingFromCloud ? 'Syncing...' : isCloudConnected ? 'Cloud (.NET / Supabase)' : 'Offline (Local)'}
              </span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition-colors"
              title="Bank Details & Business Settings"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Bank & Profile</span>
            </button>

            {/* Logged in User & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden md:block">
                <div className="text-[11px] font-bold text-white leading-tight">
                  {user?.name || 'Biswajit Pramanik'}
                </div>
                <div className="text-[9px] text-emerald-400 font-semibold leading-none">
                  Owner / Admin
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-medium"
                title="Sign Out of Portal"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-emerald-400" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
};

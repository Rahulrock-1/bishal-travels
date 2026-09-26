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
  LogOut,
  Cloud,
  CloudOff
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
    { id: 'create-invoice', label: 'New Invoice', icon: PlusCircle },
    { id: 'duty-slips', label: 'Duty Slips', icon: ClipboardList },
    { id: 'vehicles', label: 'Fleet', icon: Car },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Reports', icon: Building2 },
  ];

  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* 1. Brand Logo */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group select-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-sans whitespace-nowrap">
                {company.businessName || 'BISHAL TRAVELS'}
              </span>
              <span className="hidden 2xl:block text-[10px] uppercase font-semibold tracking-wider text-emerald-400 -mt-0.5">
                Fleet Management & GST Invoicing
              </span>
            </div>
          </div>

          {/* 2. Desktop Navigation Links (Visible on xl and above: 1280px+) */}
          <div className="hidden xl:flex items-center gap-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 3. Right Action Tools (Settings, Cloud Status, User) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Cloud Status Pill */}
            <button
              onClick={() => refreshFromCloud()}
              disabled={isLoadingFromCloud}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isCloudConnected 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60' 
                  : 'bg-amber-950/60 text-amber-300 border-amber-700/50 hover:bg-amber-900/60'
              }`}
              title={isCloudConnected ? "Connected to Render .NET Web API & Supabase PostgreSQL (Click to sync)" : "Running in Offline / LocalStorage Mode (Click to retry cloud connection)"}
            >
              {isLoadingFromCloud ? (
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isCloudConnected ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              )}
              <span className="text-[11px] font-semibold whitespace-nowrap">
                {isLoadingFromCloud ? 'Syncing...' : isCloudConnected ? 'Cloud' : 'Offline'}
              </span>
            </button>

            {/* Bank & Profile Settings Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white border border-slate-700 transition-colors whitespace-nowrap"
              title="Bank Details & Business Settings"
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Bank & Profile</span>
            </button>

            {/* User Session & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden 2xl:block">
                <div className="text-[11px] font-bold text-white leading-tight truncate max-w-[120px]">
                  {user?.name || 'Biswajit Pramanik'}
                </div>
                <div className="text-[9px] text-emerald-400 font-semibold leading-none">
                  Admin
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-medium"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline text-[11px]">Logout</span>
              </button>
            </div>
          </div>

          {/* 4. Hamburger Menu Button (Visible on screens below xl) */}
          <div className="flex xl:hidden items-center gap-1.5">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="sm:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-emerald-400" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>

        </div>
      </div>

      {/* 5. Mobile & Tablet Drawer (When hamburger menu is open) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-1.5 animate-fadeIn shadow-2xl">
          {/* Cloud Status in Mobile Drawer */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950/60 rounded-lg border border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              {isCloudConnected ? (
                <Cloud className="w-4 h-4 text-emerald-400" />
              ) : (
                <CloudOff className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs text-slate-300">Database Connection:</span>
            </div>
            <button
              onClick={() => refreshFromCloud()}
              disabled={isLoadingFromCloud}
              className={`text-xs px-2 py-0.5 rounded font-semibold ${
                isCloudConnected ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'
              }`}
            >
              {isLoadingFromCloud ? 'Syncing...' : isCloudConnected ? 'Cloud Active' : 'Offline Mode (Retry)'}
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
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
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Footer Actions (Settings & Logout) */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsSettingsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Bank & Company Profile</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 bg-rose-950/30 border border-rose-900/40 hover:bg-rose-900/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

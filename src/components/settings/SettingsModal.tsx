import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  FileCheck, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Download, 
  Upload, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  QrCode
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { CompanyProfile } from '../../types';
import { exportBackupJson, parseBackupFile } from '../../utils/storage';

export const SettingsModal: React.FC = () => {
  const { 
    company, 
    updateCompany, 
    isSettingsModalOpen, 
    setIsSettingsModalOpen,
    getAllState,
    restoreState,
    resetToSampleData 
  } = useApp();

  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [activeTab, setActiveTab] = useState<'bank' | 'business' | 'terms' | 'backup'>('bank');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Sync when modal opens
  React.useEffect(() => {
    if (isSettingsModalOpen) {
      setFormData(company);
      setSavedSuccess(false);
      setImportStatus(null);
    }
  }, [isSettingsModalOpen, company]);

  const handleChange = (field: keyof CompanyProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompany(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsSettingsModalOpen(false);
    }, 1200);
  };

  const handleBackupExport = () => {
    exportBackupJson(getAllState());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const state = await parseBackupFile(file);
      if (state) {
        restoreState(state);
        setFormData(state.company);
        setImportStatus('Backup restored successfully! All data updated.');
      } else {
        setImportStatus('Invalid backup file format.');
      }
    } catch {
      setImportStatus('Failed to read file.');
    }
  };

  return (
    <Modal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
      title="BISHAL TRAVELS - Business & Bank Settings"
      subtitle="Configure once to auto-populate bank details, IFSC, trade license, and contract info on all invoices & PDFs"
      maxWidth="3xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'bank'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bank & Payment Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('business')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'business'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company & Trade License</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'terms'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Invoice Terms & Signatory</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'backup'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Backup & Restore</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">Business and Bank details saved successfully! All new invoices will auto-populate with these details.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: BANK DETAILS */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <QrCode className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Auto-Population Guarantee:</strong> The Bank Name, Account Number, IFSC Code, Branch, and UPI ID entered here will be stamped onto every Tax Invoice and PDF payment section automatically.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={e => handleChange('bankName', e.target.value)}
                  placeholder="e.g. State Bank of India / HDFC Bank"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account Holder Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={e => handleChange('accountHolder', e.target.value)}
                  placeholder="e.g. BISHAL TRAVELS"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bank Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={e => handleChange('accountNumber', e.target.value)}
                  placeholder="e.g. 38491029481"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  IFSC Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0003028"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Branch Name
                </label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={e => handleChange('branchName', e.target.value)}
                  placeholder="e.g. Airport Kaikhali Branch, Kolkata"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  UPI ID for Instant Payments
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={e => handleChange('upiId', e.target.value)}
                  placeholder="e.g. bishaltravels@sbi"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSINESS & LEGAL */}
        {activeTab === 'business' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business / Agency Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={e => handleChange('businessName', e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tagline / Business Subtitle
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => handleChange('tagline', e.target.value)}
                  placeholder="e.g. Car Rental & Fleet Logistics Services"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Trade License Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tradeLicenseNo}
                  onChange={e => handleChange('tradeLicenseNo', e.target.value)}
                  placeholder="e.g. 1711 or TR/KMC/778291/2024"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Vendor ID / Vendor Code
                </label>
                <input
                  type="text"
                  value={formData.vendorId || ''}
                  onChange={e => handleChange('vendorId', e.target.value)}
                  placeholder="e.g. 10482 or V-9088"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  GSTIN (GST Number)
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 19AAQFB8429M1Z8"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={e => handleChange('pan', e.target.value.toUpperCase())}
                  placeholder="e.g. AAQFB8429M"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone Numbers <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="e.g. +91 98301 24589 / +91 98310 98765"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Official Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="e.g. bishaltravels.official@gmail.com"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Office / Garage Full Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="Street, Landmark, City, State, PIN"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TERMS & SIGNATURE */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Signatory Name / Proprietor
                </label>
                <input
                  type="text"
                  value={formData.signatoryName}
                  onChange={e => handleChange('signatoryName', e.target.value)}
                  placeholder="e.g. Bishal Mondal"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Signatory Title
                </label>
                <input
                  type="text"
                  value={formData.signatoryTitle}
                  onChange={e => handleChange('signatoryTitle', e.target.value)}
                  placeholder="e.g. Authorized Signatory / Proprietor"
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Standard Invoice Terms & Conditions (One per line)
                </label>
                <textarea
                  rows={5}
                  value={formData.defaultTerms.join('\n')}
                  onChange={e => handleChange('defaultTerms', e.target.value.split('\n').filter(Boolean))}
                  placeholder="Terms will appear at the bottom of the invoice..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                Export Full System Backup
              </h4>
              <p className="text-xs text-slate-600">
                Download a complete JSON snapshot of all vehicles, duty slips, clients, invoices, and bank settings to keep a secure offline copy.
              </p>
              <button
                type="button"
                onClick={handleBackupExport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download JSON Backup File
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Restore From Backup File
              </h4>
              <p className="text-xs text-slate-600">
                Upload a previously downloaded JSON backup file to restore your entire database.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {importStatus && (
                <div className={`p-2.5 rounded text-xs font-semibold ${
                  importStatus.includes('success') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {importStatus}
                </div>
              )}
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2">
              <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-rose-600" />
                Reset To Sample Demo Data
              </h4>
              <p className="text-xs text-rose-700">
                Resets the application back to the standard BISHAL TRAVELS demo vehicles, sample trips, and invoices.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to reload default sample demo data? Any unsaved custom entries will be reset.')) {
                    resetToSampleData();
                    setIsSettingsModalOpen(false);
                  }
                }}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 shadow-sm transition-all hover:shadow"
          >
            <Save className="w-4 h-4" />
            <span>Save Business & Bank Details</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

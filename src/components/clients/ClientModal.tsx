import React, { useState, useEffect } from 'react';
import { Users, Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Client } from '../../types';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Omit<Client, 'id'>) => void;
  initialClient?: Client | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialClient,
}) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    name: '',
    companyName: '',
    gstin: '',
    pan: '',
    address: '',
    phone: '',
    email: '',
    contractRefNo: '',
    contractStartDate: '',
    contractEndDate: '',
    paymentTermsDays: 15,
    notes: '',
  });

  useEffect(() => {
    if (initialClient) {
      setFormData({
        name: initialClient.name,
        companyName: initialClient.companyName,
        gstin: initialClient.gstin,
        pan: initialClient.pan || '',
        address: initialClient.address,
        phone: initialClient.phone,
        email: initialClient.email,
        contractRefNo: initialClient.contractRefNo,
        contractStartDate: initialClient.contractStartDate || '',
        contractEndDate: initialClient.contractEndDate || '',
        paymentTermsDays: initialClient.paymentTermsDays || 15,
        notes: initialClient.notes || '',
      });
    } else {
      setFormData({
        name: '',
        companyName: '',
        gstin: '',
        pan: '',
        address: '',
        phone: '',
        email: '',
        contractRefNo: '',
        contractStartDate: new Date().toISOString().slice(0, 10),
        contractEndDate: '',
        paymentTermsDays: 15,
        notes: '',
      });
    }
  }, [initialClient, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClient ? `Edit Client (${initialClient.companyName || initialClient.name})` : 'Add New Client / Corporate Account'}
      subtitle="Configure client billing details, GSTIN, and contract agreement number for auto-population"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Company / Client Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Eastern Infrastructure Projects Ltd. / John Doe"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Person
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Amitabh Sen (GM Logistics)"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contract Ref. / Agreement No <span className="text-emerald-700">*</span>
            </label>
            <input
              type="text"
              value={formData.contractRefNo}
              onChange={e => setFormData({ ...formData, contractRefNo: e.target.value })}
              placeholder="e.g. EIPL/TRAN/2026-27/044"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Client GSTIN
            </label>
            <input
              type="text"
              value={formData.gstin}
              onChange={e => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              placeholder="e.g. 19AABCE8941N1ZK"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono uppercase font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Client PAN
            </label>
            <input
              type="text"
              value={formData.pan}
              onChange={e => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
              placeholder="e.g. AABCE8941N"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98300 00000"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. accounts@client.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Billing Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full official office/billing address..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Terms (Days)
            </label>
            <input
              type="number"
              value={formData.paymentTermsDays}
              onChange={e => setFormData({ ...formData, paymentTermsDays: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contract Start Date
            </label>
            <input
              type="date"
              value={formData.contractStartDate}
              onChange={e => setFormData({ ...formData, contractStartDate: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Special Notes / Contract Particulars
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. 2500 KM / 250 Hours monthly package, Extra KM @ ₹14, Night halt @ ₹350"
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{initialClient ? 'Update Client' : 'Add Client'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

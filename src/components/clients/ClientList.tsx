import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, Building, Phone, Mail, FileText, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { ClientModal } from './ClientModal';
import { formatDate } from '../../utils/formatters';

export const ClientList: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, invoices, setActiveTab } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contractRefNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = (data: Omit<Client, 'id'>) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      addClient(data);
    }
    setEditingClient(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete client "${name}"?`)) {
      deleteClient(id);
    }
  };

  const getClientInvoiceCount = (clientId: string) => {
    return invoices.filter(inv => inv.clientId === clientId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Clients & Corporate Accounts</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your corporate clients, contract reference numbers, GST numbers, and payment terms
          </p>
        </div>

        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="w-full sm:w-80">
        <input
          type="text"
          placeholder="Search by company name, contract ref, GSTIN..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
        />
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredClients.map(client => {
          const invCount = getClientInvoiceCount(client.id);
          return (
            <div 
              key={client.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {client.companyName}
                    </h3>
                    {client.name && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Attn: {client.name}</p>
                    )}
                  </div>
                  {client.contractRefNo && (
                    <span className="shrink-0 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-mono font-bold">
                      {client.contractRefNo}
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1.5 pt-1 text-slate-600">
                  {client.gstin && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 w-16">GSTIN:</span>
                      <span className="font-mono font-semibold text-slate-800">{client.gstin}</span>
                    </div>
                  )}
                  {client.pan && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 w-16">PAN:</span>
                      <span className="font-mono font-semibold text-slate-800">{client.pan}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-16 shrink-0">Address:</span>
                    <span className="text-slate-700 leading-relaxed">{client.address}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{client.phone}</span>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate max-w-[180px]">{client.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {client.notes && (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 italic">
                    "{client.notes}"
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {invCount} {invCount === 1 ? 'Invoice' : 'Invoices'} generated
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingClient(client);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(client.id, client.companyName)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No clients found</h4>
          <p className="text-xs text-slate-500 mt-1">Add a client profile to get started.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSave}
        initialClient={editingClient}
      />
    </div>
  );
};

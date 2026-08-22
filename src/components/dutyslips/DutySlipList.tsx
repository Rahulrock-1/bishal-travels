import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  FileText, 
  Calendar, 
  Car, 
  Building, 
  Clock, 
  Moon, 
  ParkingSquare, 
  ArrowRight,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DutySlip } from '../../types';
import { DutySlipModal } from './DutySlipModal';
import { MonthlyLogSheetEditor } from './MonthlyLogSheetEditor';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportDutySlipsCsv } from '../../utils/pdfGenerator';
import { Badge } from '../common/Badge';

export const DutySlipList: React.FC = () => {
  const { 
    dutySlips, 
    vehicles, 
    clients, 
    addDutySlip, 
    updateDutySlip, 
    deleteDutySlip, 
    setActiveTab 
  } = useApp();

  // Mode: 'monthly-sheet' (full month 1st-31st spreadsheet) vs 'list' (individual slips table)
  const [viewMode, setViewMode] = useState<'monthly-sheet' | 'list'>('monthly-sheet');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<DutySlip | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const vehicleMap = new Map(vehicles.map(v => [v.id, v]));
  const clientMap = new Map(clients.map(c => [c.id, c]));

  const filteredSlips = dutySlips.filter(s => {
    const veh = vehicleMap.get(s.vehicleId);
    const cli = clientMap.get(s.clientId);
    
    const matchesSearch = 
      s.dutySlipNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (veh?.regNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (cli?.companyName.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesVeh = vehicleFilter === 'All' || s.vehicleId === vehicleFilter;
    const matchesCli = clientFilter === 'All' || s.clientId === clientFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

    return matchesSearch && matchesVeh && matchesCli && matchesStatus;
  });

  // Calculate summary metrics for currently filtered slips
  const totalKm = filteredSlips.reduce((sum, s) => sum + (s.totalKm || 0), 0);
  const totalNight = filteredSlips.reduce((sum, s) => sum + (s.nightCharges || 0), 0);
  const totalParking = filteredSlips.reduce((sum, s) => sum + (s.parkingCharges || 0), 0);
  const totalToll = filteredSlips.reduce((sum, s) => sum + (s.tollCharges || 0), 0);
  const totalDriverBatta = filteredSlips.reduce((sum, s) => sum + (s.driverBatta || 0), 0);

  const handleSave = (data: Omit<DutySlip, 'id' | 'status'>) => {
    if (editingSlip) {
      updateDutySlip(editingSlip.id, data);
    } else {
      addDutySlip(data);
    }
    setEditingSlip(null);
  };

  const handleDelete = (id: string, no: string) => {
    if (window.confirm(`Are you sure you want to delete duty slip ${no}?`)) {
      deleteDutySlip(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('monthly-sheet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'monthly-sheet'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Monthly Day-Wise Sheet (1st to 31st)</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <List className="w-4 h-4" />
            <span>All Duty Slips List ({dutySlips.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingSlip(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Quick Single Slip</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW 1: MONTHLY DAY-WISE SPREADSHEET */}
      {viewMode === 'monthly-sheet' && (
        <MonthlyLogSheetEditor />
      )}

      {/* RENDER VIEW 2: DUTY SLIPS TABLE LIST */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
                <span>Recorded Duty Slips List</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Filter and manage individual trip records and billing statuses
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => exportDutySlipsCsv(filteredSlips, vehicles, clients)}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                title="Download CSV report"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Aggregate Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Distance Run</span>
              <span className="text-lg font-mono font-black text-emerald-400">{totalKm} KM</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Night Charges</span>
              <span className="text-lg font-mono font-black text-amber-300">{formatCurrency(totalNight)}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Parking & Toll</span>
              <span className="text-lg font-mono font-black text-blue-300">{formatCurrency(totalParking + totalToll)}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Driver Allowance</span>
              <span className="text-lg font-mono font-black text-purple-300">{formatCurrency(totalDriverBatta)}</span>
            </div>
            <div className="p-3 bg-emerald-600/30 rounded-xl border border-emerald-500/30 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200">Unbilled Trips</span>
              <span className="text-lg font-mono font-black text-white">
                {dutySlips.filter(s => s.status === 'Pending').length} Trips
              </span>
            </div>
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Search slip #, route, driver..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />

            <select
              value={vehicleFilter}
              onChange={e => setVehicleFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-sm font-medium"
            >
              <option value="All">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.regNumber} ({v.model})</option>
              ))}
            </select>

            <select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-sm font-medium"
            >
              <option value="All">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-sm font-medium"
            >
              <option value="All">All Billing Status</option>
              <option value="Pending">Pending (Unbilled)</option>
              <option value="Billed">Billed</option>
            </select>
          </div>

          {/* Table of Duty Slips */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Slip / Date</th>
                    <th className="py-3 px-4">Car & Driver</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Route & Purpose</th>
                    <th className="py-3 px-4">Run KM (Start - End)</th>
                    <th className="py-3 px-4">Timings (Hrs)</th>
                    <th className="py-3 px-4">Night / Park / Toll</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredSlips.map(slip => {
                    const veh = vehicleMap.get(slip.vehicleId);
                    const cli = clientMap.get(slip.clientId);

                    return (
                      <tr key={slip.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{slip.dutySlipNo}</span>
                          <span className="text-[11px] text-slate-500">{formatDate(slip.date)}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-emerald-800 block">
                            {veh?.regNumber || 'Unknown'}
                          </span>
                          <span className="text-[11px] text-slate-500">{slip.driverName}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">
                            {cli?.companyName || cli?.name || 'Unknown'}
                          </span>
                          {cli?.contractRefNo && (
                            <span className="text-[10px] font-mono text-slate-500">{cli.contractRefNo}</span>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-[200px] truncate" title={slip.route}>
                          <span className="text-slate-800 font-medium">{slip.route}</span>
                          {slip.notes && (
                            <span className="text-[10px] text-slate-400 block italic truncate">{slip.notes}</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{slip.totalKm} KM</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {slip.startKm} → {slip.endKm}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block">{slip.totalHours} Hrs</span>
                          <span className="text-[10px] text-slate-400">
                            {slip.startTime} - {slip.endTime}
                          </span>
                        </td>

                        <td className="py-3 px-4 space-y-0.5 font-mono text-[11px]">
                          {slip.nightCharges > 0 && (
                            <div className="text-amber-700">Night: ₹{slip.nightCharges}</div>
                          )}
                          {(slip.parkingCharges > 0 || slip.tollCharges > 0) && (
                            <div className="text-blue-700">Park/Toll: ₹{slip.parkingCharges + slip.tollCharges}</div>
                          )}
                          {slip.nightCharges === 0 && slip.parkingCharges === 0 && slip.tollCharges === 0 && (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={slip.status === 'Billed' ? 'neutral' : 'success'}
                            size="sm"
                            dot
                          >
                            {slip.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setEditingSlip(slip);
                              setIsModalOpen(true);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit slip"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(slip.id, slip.dutySlipNo)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete slip"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredSlips.length === 0 && (
              <div className="text-center py-12 p-8">
                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">No duty slips found</h4>
                <p className="text-xs text-slate-500 mt-1">Record daily vehicle runs or adjust your filters above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Single Duty Slip Modal */}
      <DutySlipModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSlip(null);
        }}
        onSave={handleSave}
        initialDutySlip={editingSlip}
      />
    </div>
  );
};

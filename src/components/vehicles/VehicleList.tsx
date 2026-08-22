import React, { useState } from 'react';
import { Car, Plus, Edit2, Trash2, Fuel, User, Phone, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Vehicle } from '../../types';
import { VehicleModal } from './VehicleModal';
import { formatCurrency } from '../../utils/formatters';
import { Badge } from '../common/Badge';

export const VehicleList: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, dutySlips } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.regNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = (data: Omit<Vehicle, 'id'>) => {
    if (editingVehicle) {
      updateVehicle(editingVehicle.id, data);
    } else {
      addVehicle(data);
    }
    setEditingVehicle(null);
  };

  const handleDelete = (id: string, reg: string) => {
    if (window.confirm(`Are you sure you want to delete vehicle ${reg}?`)) {
      deleteVehicle(id);
    }
  };

  // Calculate stats for each vehicle
  const getVehicleStats = (vehicleId: string) => {
    const slips = dutySlips.filter(ds => ds.vehicleId === vehicleId);
    const totalKm = slips.reduce((sum, s) => sum + s.totalKm, 0);
    const totalTrips = slips.length;
    return { totalKm, totalTrips };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Car className="w-6 h-6 text-emerald-600" />
            <span>Fleet & Vehicle Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your cars, assigned drivers, and configure default monthly and per-KM billing rates
          </p>
        </div>

        <button
          onClick={() => {
            setEditingVehicle(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by car number, model, driver..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-3.5 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium text-slate-700 shadow-sm"
        >
          <option value="All">All Categories</option>
          <option value="Sedan">Sedan</option>
          <option value="Innova Crysta">Innova Crysta</option>
          <option value="SUV">SUV</option>
          <option value="Hatchback">Hatchback</option>
          <option value="Tempo Traveller">Tempo Traveller</option>
          <option value="Luxury">Luxury</option>
        </select>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVehicles.map(vehicle => {
          const stats = getVehicleStats(vehicle.id);
          return (
            <div 
              key={vehicle.id} 
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Top Card Banner */}
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold tracking-wider">
                      {vehicle.regNumber}
                    </span>
                    <h3 className="font-bold text-sm text-white mt-1.5">{vehicle.model}</h3>
                  </div>
                  <Badge 
                    variant={vehicle.status === 'Active' ? 'success' : vehicle.status === 'Maintenance' ? 'warning' : 'neutral'}
                    size="sm"
                    dot
                  >
                    {vehicle.status}
                  </Badge>
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                      <span className="font-semibold text-slate-800">{vehicle.type}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Fuel Type</span>
                      <span className="font-semibold text-slate-800">{vehicle.fuelType}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium">Driver: <strong className="text-slate-800">{vehicle.driverName || 'Not assigned'}</strong></span>
                    </div>
                    {vehicle.driverPhone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{vehicle.driverPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing Info */}
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Monthly Package:</span>
                      <strong className="text-emerald-900 font-mono">{formatCurrency(vehicle.baseMonthlyRate)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Per KM Rate:</span>
                      <strong className="text-emerald-900 font-mono">₹{vehicle.ratePerKm}/KM</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Extra Hour / Night:</span>
                      <strong className="text-emerald-900 font-mono">₹{vehicle.ratePerHour}/hr • ₹{vehicle.nightChargeRate}/nt</strong>
                    </div>
                  </div>

                  {/* Trip Stats */}
                  <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
                    <span>Total Recorded Run: <strong className="text-slate-800">{stats.totalKm} KM</strong></span>
                    <span>Trips: <strong className="text-slate-800">{stats.totalTrips}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingVehicle(vehicle);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Edit vehicle"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id, vehicle.regNumber)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Delete vehicle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">No vehicles found</h4>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or add a new vehicle to get started.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVehicle(null);
        }}
        onSave={handleSave}
        initialVehicle={editingVehicle}
      />
    </div>
  );
};

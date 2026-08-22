import React, { useState, useEffect } from 'react';
import { Car, Save } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Vehicle, VehicleType, FuelType } from '../../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id'>) => void;
  initialVehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialVehicle,
}) => {
  const [formData, setFormData] = useState<Omit<Vehicle, 'id'>>({
    regNumber: '',
    model: '',
    type: 'Sedan',
    fuelType: 'Diesel',
    driverName: '',
    driverPhone: '',
    baseMonthlyRate: 35000,
    ratePerKm: 14,
    ratePerHour: 120,
    nightChargeRate: 350,
    status: 'Active',
    notes: '',
  });

  useEffect(() => {
    if (initialVehicle) {
      setFormData({
        regNumber: initialVehicle.regNumber,
        model: initialVehicle.model,
        type: initialVehicle.type,
        fuelType: initialVehicle.fuelType,
        driverName: initialVehicle.driverName,
        driverPhone: initialVehicle.driverPhone,
        baseMonthlyRate: initialVehicle.baseMonthlyRate,
        ratePerKm: initialVehicle.ratePerKm,
        ratePerHour: initialVehicle.ratePerHour,
        nightChargeRate: initialVehicle.nightChargeRate,
        status: initialVehicle.status,
        notes: initialVehicle.notes || '',
      });
    } else {
      setFormData({
        regNumber: '',
        model: '',
        type: 'Sedan',
        fuelType: 'Diesel',
        driverName: '',
        driverPhone: '',
        baseMonthlyRate: 35000,
        ratePerKm: 14,
        ratePerHour: 120,
        nightChargeRate: 350,
        status: 'Active',
        notes: '',
      });
    }
  }, [initialVehicle, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialVehicle ? `Edit Vehicle (${initialVehicle.regNumber})` : 'Add New Car to Fleet'}
      subtitle="Register vehicle specifications, assigned driver, and default billing rates"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Registration No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.regNumber}
              onChange={e => setFormData({ ...formData, regNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. WB 02 AB 1234"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold uppercase"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Car Model / Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. Maruti Swift Dzire / Innova Crysta"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Category
            </label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value as VehicleType })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            >
              <option value="Sedan">Sedan (Dzire, Etios, Amaze)</option>
              <option value="Innova Crysta">Innova Crysta (7/8 Seater)</option>
              <option value="SUV">SUV (Ertiga, Scorpio, Bolero)</option>
              <option value="Hatchback">Hatchback (WagonR, Swift)</option>
              <option value="Tempo Traveller">Tempo Traveller (13-26 Seater)</option>
              <option value="Bus">Luxury Bus / Mini Coach</option>
              <option value="Luxury">Luxury (Audi, BMW, Merc)</option>
              <option value="Commercial Cab">Commercial Cab</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Fuel Type
            </label>
            <select
              value={formData.fuelType}
              onChange={e => setFormData({ ...formData, fuelType: e.target.value as FuelType })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
            >
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
              <option value="CNG">CNG</option>
              <option value="Electric">Electric (EV)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Default Driver Name
            </label>
            <input
              type="text"
              value={formData.driverName}
              onChange={e => setFormData({ ...formData, driverName: e.target.value })}
              placeholder="e.g. Ramesh Das"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Driver Phone Number
            </label>
            <input
              type="text"
              value={formData.driverPhone}
              onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
              Default Billing Rates (Auto-fills in new trips & invoices)
            </h4>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Monthly Package Base Rate (₹)
            </label>
            <input
              type="number"
              value={formData.baseMonthlyRate}
              onChange={e => setFormData({ ...formData, baseMonthlyRate: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Rate Per KM (₹ / KM)
            </label>
            <input
              type="number"
              value={formData.ratePerKm}
              onChange={e => setFormData({ ...formData, ratePerKm: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Rate Per Extra Hour (₹ / Hr)
            </label>
            <input
              type="number"
              value={formData.ratePerHour}
              onChange={e => setFormData({ ...formData, ratePerHour: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Default Night Halt Charge (₹ / Night)
            </label>
            <input
              type="number"
              value={formData.nightChargeRate}
              onChange={e => setFormData({ ...formData, nightChargeRate: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Status
            </label>
            <div className="flex gap-4">
              {(['Active', 'Maintenance', 'Inactive'] as const).map(st => (
                <label key={st} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === st}
                    onChange={() => setFormData({ ...formData, status: st })}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{st}</span>
                </label>
              ))}
            </div>
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
            <span>{initialVehicle ? 'Update Vehicle' : 'Add Vehicle'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

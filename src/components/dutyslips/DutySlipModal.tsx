import React, { useState, useEffect } from 'react';
import { ClipboardList, Save, Calculator } from 'lucide-react';
import { Modal } from '../common/Modal';
import { DutySlip } from '../../types';
import { useApp } from '../../context/AppContext';
import { calculateDutySlipMetrics } from '../../utils/calculations';

interface DutySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dutySlip: Omit<DutySlip, 'id' | 'status'>) => void;
  initialDutySlip?: DutySlip | null;
}

export const DutySlipModal: React.FC<DutySlipModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDutySlip,
}) => {
  const { vehicles, clients, dutySlips } = useApp();

  const [formData, setFormData] = useState<Omit<DutySlip, 'id' | 'status'>>({
    dutySlipNo: '',
    date: new Date().toISOString().slice(0, 10),
    vehicleId: vehicles[0]?.id || '',
    clientId: clients[0]?.id || '',
    route: '',
    driverName: vehicles[0]?.driverName || '',
    startKm: 0,
    endKm: 0,
    totalKm: 0,
    startTime: '08:00',
    endTime: '18:00',
    totalHours: 10,
    extraHours: 2,
    nightCharges: 0,
    parkingCharges: 0,
    tollCharges: 0,
    driverBatta: 0,
    fuelCharges: 0,
    otherExpenses: 0,
    notes: '',
  });

  useEffect(() => {
    if (initialDutySlip) {
      setFormData({
        dutySlipNo: initialDutySlip.dutySlipNo,
        date: initialDutySlip.date,
        vehicleId: initialDutySlip.vehicleId,
        clientId: initialDutySlip.clientId,
        route: initialDutySlip.route,
        driverName: initialDutySlip.driverName,
        startKm: initialDutySlip.startKm,
        endKm: initialDutySlip.endKm,
        totalKm: initialDutySlip.totalKm,
        startTime: initialDutySlip.startTime,
        endTime: initialDutySlip.endTime,
        totalHours: initialDutySlip.totalHours,
        extraHours: initialDutySlip.extraHours,
        nightCharges: initialDutySlip.nightCharges,
        parkingCharges: initialDutySlip.parkingCharges,
        tollCharges: initialDutySlip.tollCharges,
        driverBatta: initialDutySlip.driverBatta,
        fuelCharges: initialDutySlip.fuelCharges,
        otherExpenses: initialDutySlip.otherExpenses,
        notes: initialDutySlip.notes || '',
        invoiceId: initialDutySlip.invoiceId,
      });
    } else if (isOpen) {
      // Find latest end KM for first vehicle to default as start KM
      const defaultVehicle = vehicles[0];
      const latestSlip = dutySlips
        .filter(ds => ds.vehicleId === defaultVehicle?.id)
        .sort((a, b) => b.endKm - a.endKm)[0];
      const startKm = latestSlip ? latestSlip.endKm : 10000;
      const endKm = startKm + 120;

      const nextNum = `DS-${new Date().getFullYear()}-${String(dutySlips.length + 1).padStart(4, '0')}`;

      setFormData({
        dutySlipNo: nextNum,
        date: new Date().toISOString().slice(0, 10),
        vehicleId: defaultVehicle?.id || '',
        clientId: clients[0]?.id || '',
        route: 'Local Duty / Corporate Movement',
        driverName: defaultVehicle?.driverName || '',
        startKm,
        endKm,
        totalKm: endKm - startKm,
        startTime: '08:30',
        endTime: '18:30',
        totalHours: 10,
        extraHours: 2,
        nightCharges: 0,
        parkingCharges: 0,
        tollCharges: 0,
        driverBatta: 0,
        fuelCharges: 0,
        otherExpenses: 0,
        notes: '',
      });
    }
  }, [initialDutySlip, isOpen, vehicles, clients, dutySlips]);

  // Recalculate metrics whenever KM or Time changes
  const handleKmTimeChange = (field: string, val: any) => {
    const updated = { ...formData, [field]: val };
    const metrics = calculateDutySlipMetrics({
      startKm: updated.startKm,
      endKm: updated.endKm,
      startTime: updated.startTime,
      endTime: updated.endTime,
      baseDutyHours: 8,
    });
    setFormData({
      ...updated,
      totalKm: metrics.totalKm,
      totalHours: metrics.totalHours,
      extraHours: metrics.extraHours,
    });
  };

  const handleVehicleChange = (vId: string) => {
    const veh = vehicles.find(v => v.id === vId);
    setFormData(prev => ({
      ...prev,
      vehicleId: vId,
      driverName: veh?.driverName || prev.driverName,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialDutySlip ? `Edit Duty Slip (${initialDutySlip.dutySlipNo})` : 'New Daily Duty Slip / Car Run Entry'}
      subtitle="Log vehicle distance, timings, night charges, parking fees, and toll expenses"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Duty Slip No <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.dutySlipNo}
              onChange={e => setFormData({ ...formData, dutySlipNo: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Duty Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Client / Company <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.clientId}
              onChange={e => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
              required
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Car / Vehicle <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.vehicleId}
              onChange={e => handleVehicleChange(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono font-bold"
              required
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.regNumber} ({v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Driver on Duty
            </label>
            <input
              type="text"
              value={formData.driverName}
              onChange={e => setFormData({ ...formData, driverName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Duty Route / Location
            </label>
            <input
              type="text"
              value={formData.route}
              onChange={e => setFormData({ ...formData, route: e.target.value })}
              placeholder="e.g. Kolkata Airport to Salt Lake"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
          </div>
        </div>

        {/* KM & Timings Calculation Box */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            Odometer Reading & Duty Timings (Auto-Calculates KM & Hours)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Starting KM
              </label>
              <input
                type="number"
                value={formData.startKm}
                onChange={e => handleKmTimeChange('startKm', Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Closing KM
              </label>
              <input
                type="number"
                value={formData.endKm}
                onChange={e => handleKmTimeChange('endKm', Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Opening Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={e => handleKmTimeChange('startTime', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Closing Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={e => handleKmTimeChange('endTime', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Calculated Output Pill */}
          <div className="p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center justify-around text-xs font-bold text-emerald-950">
            <div>
              Total Run: <span className="text-sm font-black font-mono text-emerald-800">{formData.totalKm} KM</span>
            </div>
            <div>
              Total Duty: <span className="text-sm font-black font-mono text-emerald-800">{formData.totalHours} Hrs</span>
            </div>
            <div>
              Extra Overtime: <span className="text-sm font-black font-mono text-emerald-800">{formData.extraHours} Hrs</span>
            </div>
          </div>
        </div>

        {/* Expenses & Extra Charges */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Trip Charges & Expenses (In Rupees ₹)
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Night Halt Charge (₹)
              </label>
              <input
                type="number"
                value={formData.nightCharges}
                onChange={e => setFormData({ ...formData, nightCharges: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Parking Charges (₹)
              </label>
              <input
                type="number"
                value={formData.parkingCharges}
                onChange={e => setFormData({ ...formData, parkingCharges: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Toll Tax Charges (₹)
              </label>
              <input
                type="number"
                value={formData.tollCharges}
                onChange={e => setFormData({ ...formData, tollCharges: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Driver Batta / Meal (₹)
              </label>
              <input
                type="number"
                value={formData.driverBatta}
                onChange={e => setFormData({ ...formData, driverBatta: Number(e.target.value) })}
                className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Remarks / Requisition Slip Reference
          </label>
          <input
            type="text"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="e.g. Airport Parking slip attached #4812"
            className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
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
            <span>{initialDutySlip ? 'Update Duty Slip' : 'Save Duty Slip'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

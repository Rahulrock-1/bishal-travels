import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Car, 
  Building, 
  Save, 
  Sparkles, 
  Calculator, 
  FileText, 
  Clock, 
  Moon, 
  ParkingSquare, 
  Check, 
  RotateCcw,
  Layers,
  ArrowRight,
  Info,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DutySlip } from '../../types';
import { calculateDutySlipMetrics } from '../../utils/calculations';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters';
import { BishalMonthlyInvoicePdfTemplate } from '../invoices/BishalMonthlyInvoicePdfTemplate';
import { downloadInvoiceAsPdf } from '../../utils/pdfGenerator';

interface DailyRowData {
  dayNumber: number;
  dateStr: string;
  dayName: string;
  isSunday: boolean;
  isOffDay: boolean;
  dutySlipNo: string;
  route: string;
  startKm: number;
  endKm: number;
  totalKm: number;
  startTime: string;
  endTime: string;
  totalHours: number;
  extraHours: number;
  nightCharges: number;
  parkingCharges: number;
  tollCharges: number;
  driverBatta: number;
  notes: string;
}

export const MonthlyLogSheetEditor: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { 
    company,
    vehicles, 
    clients, 
    dutySlips, 
    addDutySlip, 
    updateDutySlip, 
    setActiveTab, 
    createInvoice, 
    setSelectedInvoiceForView 
  } = useApp();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [driverName, setDriverName] = useState<string>(vehicles[0]?.driverName || '');
  
  // Starting base odometer for Day 1
  const [initialStartKm, setInitialStartKm] = useState<number>(14000);
  const [dailyAvgKm, setDailyAvgKm] = useState<number>(90);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [rows, setRows] = useState<DailyRowData[]>([]);

  // Update driver name when vehicle changes
  useEffect(() => {
    const veh = vehicles.find(v => v.id === selectedVehicleId);
    if (veh) {
      setDriverName(veh.driverName || '');
    }
  }, [selectedVehicleId, vehicles]);

  // Generate rows for all days in the selected month & year
  useEffect(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    // Check if there are existing duty slips for this vehicle in this month
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const existingSlips = dutySlips.filter(ds => 
      ds.vehicleId === selectedVehicleId && ds.date.startsWith(monthPrefix)
    );
    const slipMap = new Map(existingSlips.map(s => [s.date, s]));

    const generatedRows: DailyRowData[] = [];
    let rollingKm = initialStartKm;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(selectedYear, selectedMonth, day);
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isSunday = dateObj.getDay() === 0;

      const existing = slipMap.get(dateStr);

      if (existing) {
        generatedRows.push({
          dayNumber: day,
          dateStr,
          dayName,
          isSunday,
          isOffDay: existing.totalKm === 0 && existing.route.toLowerCase().includes('off'),
          dutySlipNo: existing.dutySlipNo || `DS-${selectedYear}-${String(day).padStart(2, '0')}`,
          route: existing.route || (isSunday ? 'Sunday Off / Garage Maintenance' : 'Local Corporate Movement'),
          startKm: existing.startKm,
          endKm: existing.endKm,
          totalKm: existing.totalKm,
          startTime: existing.startTime || (isSunday ? '' : '08:30'),
          endTime: existing.endTime || (isSunday ? '' : '18:30'),
          totalHours: existing.totalHours || 0,
          extraHours: existing.extraHours || 0,
          nightCharges: existing.nightCharges || 0,
          parkingCharges: existing.parkingCharges || 0,
          tollCharges: existing.tollCharges || 0,
          driverBatta: existing.driverBatta || 0,
          notes: existing.notes || '',
        });
        rollingKm = existing.endKm;
      } else {
        const isOff = isSunday;
        const start = rollingKm;
        const run = isOff ? 0 : dailyAvgKm;
        const end = start + run;
        rollingKm = end;

        const metrics = calculateDutySlipMetrics({
          startKm: start,
          endKm: end,
          startTime: isOff ? '' : '08:30',
          endTime: isOff ? '' : '18:30',
          baseDutyHours: 8
        });

        generatedRows.push({
          dayNumber: day,
          dateStr,
          dayName,
          isSunday,
          isOffDay: isOff,
          dutySlipNo: `DS-${selectedYear}-${String(day).padStart(2, '0')}`,
          route: isOff ? 'Sunday Off / Garage Maintenance' : 'Local Corporate Movement & Office Duty',
          startKm: start,
          endKm: end,
          totalKm: isOff ? 0 : metrics.totalKm,
          startTime: isOff ? '' : '08:30',
          endTime: isOff ? '' : '18:30',
          totalHours: isOff ? 0 : metrics.totalHours,
          extraHours: isOff ? 0 : metrics.extraHours,
          nightCharges: 0,
          parkingCharges: 0,
          tollCharges: 0,
          driverBatta: 0,
          notes: '',
        });
      }
    }

    setRows(generatedRows);
  }, [selectedYear, selectedMonth, selectedVehicleId]);

  // Handle single row cell update
  const handleRowChange = (index: number, field: keyof DailyRowData, val: any) => {
    setRows(prev => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: val };

      if (field === 'startKm' || field === 'endKm' || field === 'startTime' || field === 'endTime') {
        const start = Number(field === 'startKm' ? val : row.startKm) || 0;
        const end = Number(field === 'endKm' ? val : row.endKm) || 0;
        const sTime = String(field === 'startTime' ? val : row.startTime);
        const eTime = String(field === 'endTime' ? val : row.endTime);

        const metrics = calculateDutySlipMetrics({
          startKm: start,
          endKm: end,
          startTime: sTime,
          endTime: eTime,
          baseDutyHours: 8
        });

        row.totalKm = metrics.totalKm;
        row.totalHours = metrics.totalHours;
        row.extraHours = metrics.extraHours;
      }

      copy[index] = row;
      return copy;
    });
  };

  // Auto Chain all KM entries from Day 1 to Day N
  const handleChainOdometer = () => {
    setRows(prev => {
      let currentKm = initialStartKm;
      return prev.map(row => {
        if (row.isOffDay) {
          return {
            ...row,
            startKm: currentKm,
            endKm: currentKm,
            totalKm: 0,
            totalHours: 0,
            extraHours: 0
          };
        }
        const start = currentKm;
        const end = start + (row.totalKm > 0 ? row.totalKm : dailyAvgKm);
        currentKm = end;
        return {
          ...row,
          startKm: start,
          endKm: end,
          totalKm: end - start
        };
      });
    });
  };

  // Fill all 30 days as active continuous duty
  const handleFillAllDaysActive = (includeSundays = true) => {
    setRows(prev => {
      let currentKm = initialStartKm;
      return prev.map(row => {
        const isOff = !includeSundays && row.isSunday;
        const start = currentKm;
        const run = isOff ? 0 : dailyAvgKm;
        const end = start + run;
        currentKm = end;

        const metrics = calculateDutySlipMetrics({
          startKm: start,
          endKm: end,
          startTime: isOff ? '' : '08:30',
          endTime: isOff ? '' : '18:30',
          baseDutyHours: 8
        });

        return {
          ...row,
          isOffDay: isOff,
          route: isOff ? 'Sunday Off / Garage Day' : 'Local Corporate Movement & Office Duty',
          startKm: start,
          endKm: end,
          totalKm: isOff ? 0 : run,
          startTime: isOff ? '' : '08:30',
          endTime: isOff ? '' : '18:30',
          totalHours: isOff ? 0 : metrics.totalHours,
          extraHours: isOff ? 0 : metrics.extraHours,
        };
      });
    });
  };

  // Toggle Day Off (e.g. Sunday or holiday)
  const handleToggleOffDay = (index: number) => {
    setRows(prev => {
      const copy = [...prev];
      const row = copy[index];
      const isOff = !row.isOffDay;
      copy[index] = {
        ...row,
        isOffDay: isOff,
        route: isOff ? 'Day Off / Garage Maintenance' : 'Local Corporate Movement',
        startKm: row.startKm,
        endKm: isOff ? row.startKm : row.startKm + dailyAvgKm,
        totalKm: isOff ? 0 : dailyAvgKm,
        startTime: isOff ? '' : '08:30',
        endTime: isOff ? '' : '18:30',
        totalHours: isOff ? 0 : 10,
        extraHours: isOff ? 0 : 2,
        nightCharges: 0,
        parkingCharges: 0,
        tollCharges: 0,
        driverBatta: 0
      };
      return copy;
    });
  };

  // Calculate totals
  const totalMonthKm = rows.reduce((sum, r) => sum + (r.totalKm || 0), 0);
  const totalMonthHours = rows.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalMonthNight = rows.reduce((sum, r) => sum + (Number(r.nightCharges) || 0), 0);
  const totalMonthParking = rows.reduce((sum, r) => sum + (Number(r.parkingCharges) || 0), 0);
  const totalMonthToll = rows.reduce((sum, r) => sum + (Number(r.tollCharges) || 0), 0);
  const totalMonthBatta = rows.reduce((sum, r) => sum + (Number(r.driverBatta) || 0), 0);
  const totalWorkingDays = rows.filter(r => !r.isOffDay && r.totalKm > 0).length;

  // Save all rows to AppContext duty slips
  const handleSaveAllSlips = () => {
    let count = 0;
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    rows.forEach(r => {
      // Find existing slip for this date & vehicle
      const existing = dutySlips.find(
        ds => ds.vehicleId === selectedVehicleId && ds.date === r.dateStr
      );

      const slipPayload: Omit<DutySlip, 'id' | 'status'> = {
        dutySlipNo: r.dutySlipNo,
        date: r.dateStr,
        vehicleId: selectedVehicleId,
        clientId: selectedClientId,
        route: r.route,
        driverName: driverName,
        startKm: r.startKm,
        endKm: r.endKm,
        totalKm: r.totalKm,
        startTime: r.startTime,
        endTime: r.endTime,
        totalHours: r.totalHours,
        extraHours: r.extraHours,
        nightCharges: Number(r.nightCharges) || 0,
        parkingCharges: Number(r.parkingCharges) || 0,
        tollCharges: Number(r.tollCharges) || 0,
        driverBatta: Number(r.driverBatta) || 0,
        fuelCharges: 0,
        otherExpenses: 0,
        notes: r.notes,
      };

      if (existing) {
        updateDutySlip(existing.id, slipPayload);
      } else {
        addDutySlip(slipPayload);
      }
      count++;
    });

    setSaveSuccessMsg(`Successfully saved all ${rows.length} daily logs for ${new Date(selectedYear, selectedMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const selectedMonthName = new Date(selectedYear, selectedMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const selectedVeh = vehicles.find(v => v.id === selectedVehicleId);
  const selectedCli = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold mb-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Full Month Day-Wise Log Sheet</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Daily Car Run & Surcharge Sheet (1st to 31st)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Fill in day-by-day odometer readings, start/closing times, night halt charges, parking and tolls in one single monthly spreadsheet view.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveAllSlips}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>Save Full Month Log Sheet</span>
            </button>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Select Month & Year
            </label>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-bold"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(2026, i, 1).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-mono font-bold"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Select Car / Vehicle
            </label>
            <select
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-mono font-bold"
            >
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.regNumber} ({v.model})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Select Client / Account
            </label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-semibold"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.companyName || c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Driver on Duty
            </label>
            <input
              type="text"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-medium"
              placeholder="Driver Name"
            />
          </div>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Auto-Fill & Quick Tools Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Day 1 Start KM:</span>
            <input
              type="number"
              value={initialStartKm}
              onChange={e => setInitialStartKm(Number(e.target.value))}
              className="w-24 px-2 py-1 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Default Run/Day:</span>
            <input
              type="number"
              value={dailyAvgKm}
              onChange={e => setDailyAvgKm(Number(e.target.value))}
              className="w-20 px-2 py-1 border border-slate-300 rounded-lg font-mono font-bold"
            />
            <span className="text-slate-500">KM</span>
          </div>

          <button
            onClick={handleChainOdometer}
            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            title="Automatically connects each day's Start KM to the previous day's End KM"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-Chain KM Sequence</span>
          </button>

          <button
            onClick={() => handleFillAllDaysActive(true)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            title="Fill all 30/31 days with daily run (e.g. 80 KM/day)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>⚡ Fill All 30 Days Active</span>
          </button>

          <button
            onClick={() => handleFillAllDaysActive(false)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
            title="Fill working days (Mon-Sat) and mark Sundays as Off"
          >
            <span>Fill Mon-Sat (Sundays Off)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>Click the "Off" button on any day to mark Sunday / Maintenance / Holiday</span>
        </div>
      </div>

      {/* Full Month Spreadsheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center border-r border-slate-700">Day / Date</th>
                <th className="py-2.5 px-2.5 w-20 border-r border-slate-700">Slip No</th>
                <th className="py-2.5 px-3 border-r border-slate-700">Route & Duty Particulars</th>
                <th className="py-2.5 px-2 w-24 text-center border-r border-slate-700">Start KM</th>
                <th className="py-2.5 px-2 w-24 text-center border-r border-slate-700">End KM</th>
                <th className="py-2.5 px-2 w-20 text-center border-r border-slate-700">Run (KM)</th>
                <th className="py-2.5 px-2 w-20 text-center border-r border-slate-700">Start Time</th>
                <th className="py-2.5 px-2 w-20 text-center border-r border-slate-700">End Time</th>
                <th className="py-2.5 px-2 w-16 text-center border-r border-slate-700">Hours</th>
                <th className="py-2.5 px-2 w-20 text-right border-r border-slate-700">Night (₹)</th>
                <th className="py-2.5 px-2 w-20 text-right border-r border-slate-700">Parking (₹)</th>
                <th className="py-2.5 px-2 w-20 text-right border-r border-slate-700">Toll (₹)</th>
                <th className="py-2.5 px-2 w-20 text-right border-r border-slate-700">Batta (₹)</th>
                <th className="py-2.5 px-2 w-16 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {rows.map((row, idx) => {
                const isSun = row.isSunday;
                const isOff = row.isOffDay;

                return (
                  <tr 
                    key={row.dateStr} 
                    className={`transition-colors ${
                      isOff 
                        ? 'bg-slate-100/80 text-slate-400' 
                        : isSun 
                        ? 'bg-amber-50/40 hover:bg-amber-50/80' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Day & Date */}
                    <td className="py-1.5 px-3 text-center border-r border-slate-200 font-mono">
                      <div className="font-bold text-slate-900 text-xs">
                        {String(row.dayNumber).padStart(2, '0')}
                      </div>
                      <div className={`text-[10px] font-semibold ${isSun ? 'text-amber-600' : 'text-slate-500'}`}>
                        {row.dayName}
                      </div>
                    </td>

                    {/* Slip No */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.dutySlipNo}
                        onChange={e => handleRowChange(idx, 'dutySlipNo', e.target.value)}
                        className="w-full px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
                      />
                    </td>

                    {/* Route / Location */}
                    <td className="py-1.5 px-2 border-r border-slate-200">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={row.route}
                          onChange={e => handleRowChange(idx, 'route', e.target.value)}
                          className={`w-full px-2 py-1 text-xs border border-slate-200 rounded ${
                            isOff ? 'bg-slate-200/60 text-slate-500 italic' : 'bg-white font-medium'
                          }`}
                          placeholder="Route or Duty description"
                        />
                        <button
                          type="button"
                          onClick={() => handleToggleOffDay(idx)}
                          className={`px-1.5 py-1 rounded text-[10px] font-bold shrink-0 transition-colors ${
                            isOff 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                          title="Toggle Day Off / Sunday"
                        >
                          {isOff ? 'OFF' : 'ON'}
                        </button>
                      </div>
                    </td>

                    {/* Start KM */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        value={row.startKm}
                        onChange={e => handleRowChange(idx, 'startKm', e.target.value)}
                        className="w-full px-1.5 py-1 text-xs font-mono font-bold text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* End KM */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        value={row.endKm}
                        onChange={e => handleRowChange(idx, 'endKm', e.target.value)}
                        className="w-full px-1.5 py-1 text-xs font-mono font-bold text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* Total KM Calculated */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-mono font-black text-emerald-950 text-xs">
                      {isOff ? '-' : `${row.totalKm} KM`}
                    </td>

                    {/* Start Time */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={e => handleRowChange(idx, 'startTime', e.target.value)}
                        className="w-full px-1 py-1 text-[11px] font-mono text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* End Time */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={e => handleRowChange(idx, 'endTime', e.target.value)}
                        className="w-full px-1 py-1 text-[11px] font-mono text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* Total Hours */}
                    <td className="py-1.5 px-1 text-center border-r border-slate-200 font-semibold text-slate-800 text-[11px]">
                      {isOff ? '-' : `${row.totalHours}h`}
                    </td>

                    {/* Night Charges */}
                    <td className="py-1.5 px-1 border-r border-slate-200">
                      <input
                        type="number"
                        value={row.nightCharges || ''}
                        onChange={e => handleRowChange(idx, 'nightCharges', e.target.value)}
                        placeholder="₹"
                        className="w-full px-1.5 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-amber-800 font-bold"
                        disabled={isOff}
                      />
                    </td>

                    {/* Parking Charges */}
                    <td className="py-1.5 px-1 border-r border-slate-200">
                      <input
                        type="number"
                        value={row.parkingCharges || ''}
                        onChange={e => handleRowChange(idx, 'parkingCharges', e.target.value)}
                        placeholder="₹"
                        className="w-full px-1.5 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-blue-800 font-bold"
                        disabled={isOff}
                      />
                    </td>

                    {/* Toll Charges */}
                    <td className="py-1.5 px-1 border-r border-slate-200">
                      <input
                        type="number"
                        value={row.tollCharges || ''}
                        onChange={e => handleRowChange(idx, 'tollCharges', e.target.value)}
                        placeholder="₹"
                        className="w-full px-1.5 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-blue-800 font-bold"
                        disabled={isOff}
                      />
                    </td>

                    {/* Driver Batta */}
                    <td className="py-1.5 px-1 border-r border-slate-200">
                      <input
                        type="number"
                        value={row.driverBatta || ''}
                        onChange={e => handleRowChange(idx, 'driverBatta', e.target.value)}
                        placeholder="₹"
                        className="w-full px-1.5 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-purple-800 font-bold"
                        disabled={isOff}
                      />
                    </td>

                    {/* Status Pill */}
                    <td className="py-1.5 px-2 text-center text-[10px]">
                      {isOff ? (
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded font-bold">OFF</span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">DUTY</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer with Monthly Aggregate Sums */}
            <tfoot className="sticky bottom-0 z-20 bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-xs">
              <tr>
                <td colSpan={3} className="py-3 px-3 uppercase text-[10px] tracking-wider text-emerald-400">
                  Monthly Total Summary ({totalWorkingDays} Duty Days):
                </td>
                <td colSpan={2} className="py-3 px-2 text-right text-slate-400 font-mono text-[11px]">
                  Total Distance:
                </td>
                <td className="py-3 px-2 text-center font-mono font-black text-emerald-300 text-sm">
                  {totalMonthKm} KM
                </td>
                <td colSpan={2} className="py-3 px-2 text-right text-slate-400 text-[11px]">
                  Total Duty:
                </td>
                <td className="py-3 px-1 text-center font-mono font-bold text-slate-200 text-xs">
                  {totalMonthHours.toFixed(1)}h
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold text-amber-300 text-xs">
                  {totalMonthNight > 0 ? `₹${totalMonthNight}` : '-'}
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold text-blue-300 text-xs">
                  {totalMonthParking > 0 ? `₹${totalMonthParking}` : '-'}
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold text-blue-300 text-xs">
                  {totalMonthToll > 0 ? `₹${totalMonthToll}` : '-'}
                </td>
                <td className="py-3 px-2 text-right font-mono font-bold text-purple-300 text-xs">
                  {totalMonthBatta > 0 ? `₹${totalMonthBatta}` : '-'}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Ready to generate client invoice for {selectedMonthName}?
            </h4>
            <p className="text-xs text-slate-500">
              Save this log sheet to automatically pull these {totalMonthKm} KMs, ₹{totalMonthNight} night charges, and ₹{totalMonthParking + totalMonthToll} parking/toll expenses into the invoice.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              handleSaveAllSlips();
              downloadInvoiceAsPdf(
                'bishal-sheet-direct-pdf-render',
                `${company.businessName || 'BISHAL_TRAVELS'}_${selectedVeh?.regNumber || 'Vehicle'}_${selectedMonthName.replace(/\s+/g, '_')}`
              );
            }}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all hover:scale-105"
            title="Download PDF in official BISHAL TRAVELS format matching JULU BISHAL.pdf"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF (BISHAL Style)</span>
          </button>

          <button
            onClick={handleSaveAllSlips}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Save Monthly Log</span>
          </button>

          <button
            onClick={() => {
              handleSaveAllSlips();
              setActiveTab('create-invoice');
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-105"
          >
            <span>Proceed to Monthly Invoice</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hidden printable template container for direct 1-click PDF download */}
      <div className="hidden">
        <div id="bishal-sheet-direct-pdf-render">
          {selectedVeh && (
            <BishalMonthlyInvoicePdfTemplate
              company={company}
              vehicle={selectedVeh}
              monthTitle={selectedMonthName}
              invoiceDateStr={`31-${String(selectedMonth + 1).padStart(2, '0')}-${selectedYear}`}
              rows={rows.map(r => ({
                date: formatDate(r.dateStr, 'dd-MM-yyyy'),
                hours: r.totalHours > 0 ? r.totalHours : '',
                km: r.totalKm > 0 ? r.totalKm : '',
                parkingCharge: Number(r.parkingCharges) || 0,
                nightCharge: Number(r.nightCharges) || 0,
                totalAmount: 0,
              }))}
              totalHours={Math.round(totalMonthHours)}
              totalKm={totalMonthKm}
              totalParking={totalMonthParking + totalMonthNight + totalMonthToll}
              grandTotalAmount={0}
              client={selectedCli}
              elementId="bishal-sheet-direct-pdf-render"
            />
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Download,
  Eye,
  Printer,
  X,
  DollarSign,
  Filter,
  Database,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DutySlip } from '../../types';
import { 
  calculateDutySlipMetrics, 
  computeRowTotalHighestExtra, 
  computeRowTotalBothKmAndOt,
  computeGarageKm,
  computeTieredKmCharges,
  TieredKmConfig
} from '../../utils/calculations';
import { formatCurrency, formatKm, formatDate } from '../../utils/formatters';
import { BishalMonthlyInvoicePdfTemplate } from '../invoices/BishalMonthlyInvoicePdfTemplate';
import { downloadInvoiceAsPdf, triggerPrint } from '../../utils/pdfGenerator';
import { Modal } from '../common/Modal';

interface DailyRowData {
  dayNumber: number;
  dateStr: string;
  dayName: string;
  isSunday: boolean;
  isOffDay: boolean;
  dutySlipNo: string;
  route: string;
  extraDuty: string;
  extraDutyCharges: number; // Dedicated editable extra duty charges in ₹
  startKm: number;
  endKm: number;
  totalKm: number;
  garageOutKm: number;     // Garage Out KM (editable)
  garageInKm: number;      // Garage In KM (editable)
  garageKm: number;        // Total Garage KM = Math.max(0, garageInKm - garageOutKm)
  startTime: string;
  endTime: string;
  totalHours: number;
  extraHours: number;      // Overtime Hours (separated & directly editable!)
  overtimeCharges: number; // extraHours * overtimeRatePerHour
  nightCharges: number;
  parkingCharges: number;
  tollCharges: number;
  driverBatta: number;
  dayTotalAmount: number;
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
    upsertDutySlip,
    batchUpsertDutySlips,
    isCloudConnected,
    setActiveTab, 
    createInvoice, 
    setSelectedInvoiceForView 
  } = useApp();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-indexed
  
  // Real-time DB Auto-Save State
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRowsRef = useRef<DailyRowData[] | null>(null);
  const userInteractedVehicleRef = useRef<boolean>(false);

  // Vehicle Active/Inactive filter (Default: 'Active' so only active vehicles are listed by default)
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<'Active' | 'All' | 'Inactive'>('Active');
  
  const activeVehicles = vehicles.filter(v => v.status === 'Active');
  const filteredVehicles = vehicles.filter(v => {
    if (vehicleStatusFilter === 'Active') return v.status === 'Active';
    if (vehicleStatusFilter === 'Inactive') return v.status === 'Inactive' || v.status === 'Maintenance';
    return true;
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    activeVehicles[0]?.id || vehicles[0]?.id || ''
  );
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [driverName, setDriverName] = useState<string>(vehicles[0]?.driverName || '');
  
  // Base Contract Package Configuration (e.g. 100 KM & 10 Hours @ ₹18/KM, OT ₹90/hr)
  const currentVeh = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const [defaultBaseKm, setDefaultBaseKm] = useState<number>(currentVeh?.defaultDailyKm || 100);
  const [defaultDutyHours, setDefaultDutyHours] = useState<number>(currentVeh?.defaultDailyHours || 10);
  const [ratePerKm, setRatePerKm] = useState<number>(currentVeh?.ratePerKm || 18);
  const [overtimeRatePerHour, setOvertimeRatePerHour] = useState<number>(currentVeh?.ratePerHour || 90);
  const [garageRatePerKm, setGarageRatePerKm] = useState<number>(currentVeh?.garageRatePerKm || currentVeh?.ratePerKm || 18);

  // PRIMARY CALCULATION MODE: 'both_km_and_overtime' (Both KM + OT calculated together) vs 'highest_extra' (Previous Logic)
  const [calcMode, setCalcMode] = useState<'both_km_and_overtime' | 'highest_extra'>('both_km_and_overtime');

  // Column Visibility Toggles
  const [showGarageInOut, setShowGarageInOut] = useState<boolean>(false);
  const [defaultGarageKm, setDefaultGarageKm] = useState<number>(20);
  const [showOvertimeCol, setShowOvertimeCol] = useState<boolean>(true);
  const [showExtraDutyCol, setShowExtraDutyCol] = useState<boolean>(true);
  const [hideTotalPrice, setHideTotalPrice] = useState<boolean>(false);
  const [pdfFormat, setPdfFormat] = useState<'dual-km-overtime' | 'bishal-official' | 'corporate-duty-annexure' | 'executive-summary'>('bishal-official');

  // Starting base odometer for Day 1
  const [initialStartKm, setInitialStartKm] = useState<number>(14000);
  const [dailyAvgKm, setDailyAvgKm] = useState<number>(currentVeh?.defaultDailyKm || 100);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [showStartEndKmInPdf, setShowStartEndKmInPdf] = useState<boolean>(false);
  const [showStartEndTimeInPdf, setShowStartEndTimeInPdf] = useState<boolean>(false);
  const [showGarageColsInPdf, setShowGarageColsInPdf] = useState<boolean>(false);

  // Dynamic Print / Invoice Date for PDF Banking & Header Details (Defaults to current date)
  const [printDate, setPrintDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  
  // Slab / Tiered KM Billing State (e.g. 2,000 KM @ ₹19/KM, excess KM @ ₹12/KM)
  const [isTieredKmEnabled, setIsTieredKmEnabled] = useState<boolean>(false);
  const [tier1KmThreshold, setTier1KmThreshold] = useState<number>(2000);
  const [tier1RatePerKm, setTier1RatePerKm] = useState<number>(19);
  const [tier2RatePerKm, setTier2RatePerKm] = useState<number>(12);
  const [isSlabConfigOpen, setIsSlabConfigOpen] = useState<boolean>(false);

  const [rows, setRows] = useState<DailyRowData[]>([]);

  // Build backend payload for a single daily row
  const buildSlipPayload = useCallback((r: DailyRowData) => {
    const existing = dutySlips.find(
      ds => (ds.vehicleId?.toLowerCase() === selectedVehicleId.toLowerCase()) && 
            ((ds.date || '').split('T')[0] === r.dateStr)
    );
    return {
      id: existing?.id,
      dutySlipNo: r.dutySlipNo,
      date: r.dateStr,
      vehicleId: selectedVehicleId,
      clientId: selectedClientId,
      route: r.route,
      extraDuty: r.extraDuty,
      extraDutyCharges: Number(r.extraDutyCharges) || 0,
      driverName: driverName,
      startKm: Number(r.startKm) || 0,
      endKm: Number(r.endKm) || 0,
      totalKm: Number(r.totalKm) || 0,
      garageOutKm: Number(r.garageOutKm) || 0,
      garageInKm: Number(r.garageInKm) || 0,
      garageKm: Number(r.garageKm) || 0,
      startTime: r.startTime || '',
      endTime: r.endTime || '',
      totalHours: Number(r.totalHours) || 0,
      extraHours: Number(r.extraHours) || 0,
      nightCharges: Number(r.nightCharges) || 0,
      parkingCharges: Number(r.parkingCharges) || 0,
      tollCharges: Number(r.tollCharges) || 0,
      driverBatta: Number(r.driverBatta) || 0,
      fuelCharges: 0,
      otherExpenses: Number(r.overtimeCharges) || 0,
      notes: r.notes || '',
      status: existing?.status || 'Pending'
    };
  }, [dutySlips, selectedVehicleId, selectedClientId, driverName]);

  // Flush pending auto-save immediately to database
  const flushAutoSave = useCallback(async (rowsToSave?: DailyRowData[]) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const targetRows = rowsToSave || pendingRowsRef.current || rows;
    if (!targetRows || targetRows.length === 0 || !selectedVehicleId || !selectedClientId) {
      return;
    }

    setIsAutoSaving(true);
    try {
      const payloads = targetRows.map(r => buildSlipPayload(r));
      await batchUpsertDutySlips(payloads);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoSavedAt(nowStr);
    } catch (err) {
      console.warn('[MonthlyLogSheetEditor] Auto-save error, queued for sync:', err);
    } finally {
      setIsAutoSaving(false);
      pendingRowsRef.current = null;
    }
  }, [rows, selectedVehicleId, selectedClientId, buildSlipPayload, batchUpsertDutySlips]);

  // Debounced trigger for real-time auto-saving during rapid edits (600ms)
  const triggerRealtimeAutoSave = useCallback((updatedRows: DailyRowData[]) => {
    pendingRowsRef.current = updatedRows;
    setIsAutoSaving(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      flushAutoSave(updatedRows);
    }, 600);
  }, [flushAutoSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // When vehicle filter changes, adjust selectedVehicleId if needed
  useEffect(() => {
    if (filteredVehicles.length > 0 && !filteredVehicles.some(v => v.id === selectedVehicleId)) {
      setSelectedVehicleId(filteredVehicles[0].id);
    }
  }, [vehicleStatusFilter, filteredVehicles, selectedVehicleId]);

  // Update rates, default base KM, duty hours & driver name when vehicle changes
  useEffect(() => {
    const veh = vehicles.find(v => v.id === selectedVehicleId);
    if (veh) {
      setDriverName(veh.driverName || '');
      setRatePerKm(veh.ratePerKm || 18);
      setOvertimeRatePerHour(veh.ratePerHour || 90);
      setGarageRatePerKm(veh.garageRatePerKm || veh.ratePerKm || 18);
      if (veh.defaultDailyKm) {
        setDefaultBaseKm(veh.defaultDailyKm);
        setDailyAvgKm(veh.defaultDailyKm);
      }
      if (veh.defaultDailyHours) {
        setDefaultDutyHours(veh.defaultDailyHours);
      }
    }
  }, [selectedVehicleId, vehicles]);

  // Auto-switch to vehicle that has saved duty slips in this month if user hasn't explicitly picked a vehicle
  useEffect(() => {
    if (userInteractedVehicleRef.current || !dutySlips.length) return;
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    // Check if current vehicle has slips in this month
    const currentHasSlips = dutySlips.some(
      ds => (ds.vehicleId?.toLowerCase() === selectedVehicleId.toLowerCase()) && 
            (ds.date || '').split('T')[0].startsWith(monthPrefix)
    );
    if (!currentHasSlips) {
      // Find another vehicle that has slips in this month
      const slipThisMonth = dutySlips.find(ds => (ds.date || '').split('T')[0].startsWith(monthPrefix));
      if (slipThisMonth && slipThisMonth.vehicleId) {
        const foundVeh = vehicles.find(v => v.id.toLowerCase() === slipThisMonth.vehicleId.toLowerCase());
        if (foundVeh && foundVeh.id !== selectedVehicleId) {
          setSelectedVehicleId(foundVeh.id);
        }
      }
    }
  }, [dutySlips, selectedYear, selectedMonth, selectedVehicleId, vehicles]);

  // Saved duty slips matching current vehicle and current month
  const matchingSlips = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const veh = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
    const vehReg = (veh?.regNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentVehId = (selectedVehicleId || '').toLowerCase().trim();

    return dutySlips.filter(ds => {
      const slipVehId = (ds.vehicleId || '').toLowerCase().trim();
      const slipVehMatches = slipVehId === currentVehId || (vehReg && slipVehId.includes(vehReg));
      const cleanDate = (ds.date || '').split('T')[0].trim();
      return slipVehMatches && cleanDate.startsWith(monthPrefix);
    });
  }, [dutySlips, selectedVehicleId, selectedYear, selectedMonth, vehicles]);

  // Summaries of all vehicles and months that have saved slips in database
  interface SavedDutySummary {
    vehicleId: string;
    vehicleReg: string;
    year: number;
    month: number;
    monthName: string;
    count: number;
  }

  const availableSavedSummaries: SavedDutySummary[] = useMemo(() => {
    const summaryMap = new Map<string, SavedDutySummary>();
    dutySlips.forEach(s => {
      const cleanDate = (s.date || '').split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          const veh = vehicles.find(v => v.id?.toLowerCase() === s.vehicleId?.toLowerCase());
          const reg = veh?.regNumber || s.vehicleId;
          const key = `${s.vehicleId}_${y}_${m}`;
          const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'short' });
          if (!summaryMap.has(key)) {
            summaryMap.set(key, { 
              vehicleId: veh?.id || s.vehicleId, 
              vehicleReg: reg, 
              year: y, 
              month: m, 
              monthName, 
              count: 0 
            });
          }
          summaryMap.get(key)!.count += 1;
        }
      }
    });
    return Array.from(summaryMap.values()).sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
  }, [dutySlips, vehicles]);

  // Compute row total amount supporting both calculation modes
  const computeRowTotal = (
    km: number,
    totalHrs: number,
    extraHrs: number,
    night: number,
    parking: number,
    toll: number,
    batta: number,
    kmRate: number,
    otRate: number,
    baseDutyHrs: number,
    baseDutyKm: number,
    garageKm: number = 0,
    garageRate: number = 0,
    extraDuty: number = 0,
    mode: 'both_km_and_overtime' | 'highest_extra' = calcMode,
    enableGarage: boolean = showGarageInOut
  ) => {
    // CRITICAL: Garage In/Out distance charges are ONLY included when showGarageInOut is ENABLED!
    const effectiveGarageKm = enableGarage ? (Number(garageKm) || 0) : 0;

    if (mode === 'both_km_and_overtime') {
      return computeRowTotalBothKmAndOt({
        km,
        totalHours: totalHrs,
        extraHours: extraHrs,
        nightCharges: night,
        parkingCharges: parking,
        tollCharges: toll,
        driverBatta: batta,
        extraDutyCharges: extraDuty,
        ratePerKm: kmRate,
        overtimeRatePerHour: otRate,
        baseDutyHours: baseDutyHrs,
        baseDutyKm: baseDutyKm,
        garageKm: effectiveGarageKm,
        garageRatePerKm: garageRate || kmRate,
        useBasePackage: false,
      });
    } else {
      return computeRowTotalHighestExtra({
        km,
        totalHours: totalHrs,
        extraHours: extraHrs,
        nightCharges: night,
        parkingCharges: parking,
        tollCharges: toll,
        driverBatta: batta,
        extraDutyCharges: extraDuty,
        ratePerKm: kmRate,
        overtimeRatePerHour: otRate,
        baseDutyHours: baseDutyHrs,
        baseDutyKm: baseDutyKm,
        garageKm: effectiveGarageKm,
        garageRatePerKm: garageRate || kmRate,
      });
    }
  };

  // Generate & Hydrate rows for all days in the selected month & year
  useEffect(() => {
    // If user is actively typing and auto-save timer is ticking, don't overwrite rows
    if (pendingRowsRef.current && pendingRowsRef.current.length > 0) {
      return;
    }

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const veh = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
    const vehReg = (veh?.regNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentVehId = (selectedVehicleId || '').toLowerCase().trim();
    const carDefaultKm = veh?.defaultDailyKm || defaultBaseKm || 100;
    const carDefaultHours = veh?.defaultDailyHours || defaultDutyHours || 10;
    
    // Check if there are existing duty slips for this vehicle in this month
    const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    const existingSlips = dutySlips.filter(ds => {
      const slipVehId = (ds.vehicleId || '').toLowerCase().trim();
      const slipVehMatches = slipVehId === currentVehId || (vehReg && slipVehId.includes(vehReg));
      const cleanDate = (ds.date || '').split('T')[0].trim();
      return slipVehMatches && cleanDate.startsWith(monthPrefix);
    });

    const slipMap = new Map<string, DutySlip>();
    existingSlips.forEach(s => {
      const cleanDate = (s.date || '').split('T')[0].trim();
      slipMap.set(cleanDate, s);
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        if (!isNaN(d)) {
          slipMap.set(`day_${d}`, s);
        }
      }
    });

    // Sync driver, client, and base odometer from existing records if available
    if (existingSlips.length > 0) {
      const firstValidSlip = existingSlips.find(s => s.driverName || s.clientId || s.startKm);
      if (firstValidSlip?.driverName && !driverName) {
        setDriverName(firstValidSlip.driverName);
      }
      if (firstValidSlip?.clientId && (!selectedClientId || selectedClientId === clients[0]?.id)) {
        setSelectedClientId(firstValidSlip.clientId);
      }
    }

    const generatedRows: DailyRowData[] = [];
    const monthPadded = String(selectedMonth + 1).padStart(2, '0');
    const vehCode = veh?.regNumber ? `${veh.regNumber.replace(/[^a-zA-Z0-9]/g, '').slice(-4)}-` : '';

    // Determine initial rolling Km
    let rollingKm = initialStartKm;
    const day1Slip = slipMap.get(`${selectedYear}-${monthPadded}-01`) || slipMap.get('day_1');
    if (day1Slip && day1Slip.startKm !== undefined && day1Slip.startKm !== null && Number(day1Slip.startKm) > 0) {
      rollingKm = Number(day1Slip.startKm);
    } else if (existingSlips.length > 0) {
      const minOdo = Math.min(...existingSlips.map(s => Number(s.startKm) || initialStartKm).filter(n => n > 0));
      if (isFinite(minOdo) && minOdo > 0) {
        rollingKm = minOdo;
      }
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(selectedYear, selectedMonth, day);
      const dayPadded = String(day).padStart(2, '0');
      const dateStr = `${selectedYear}-${monthPadded}-${dayPadded}`;
      const defaultSlipNo = `DS-${vehCode}${selectedYear}${monthPadded}-${dayPadded}`;
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const isSunday = dateObj.getDay() === 0;

      const existing = slipMap.get(dateStr) || slipMap.get(`day_${day}`);

      if (existing) {
        const isOff = (existing.totalKm === 0 && (existing.route?.toLowerCase().includes('off') || existing.route?.toLowerCase().includes('garage'))) ||
          existing.extraDuty?.toLowerCase().includes('off') ||
          (Number(existing.totalKm) === 0 && Number(existing.totalHours) === 0 && isSunday);

        // DO NOT overwrite saved 0 or custom KM with carDefaultKm!
        const kmVal = Number(existing.totalKm) || 0;
        const hrsVal = Number(existing.totalHours) || 0;
        const extraHrs = existing.extraHours !== undefined && existing.extraHours !== null
          ? Number(existing.extraHours)
          : (isOff ? 0 : Math.max(0, hrsVal - defaultDutyHours));
        const otCost = extraHrs * overtimeRatePerHour;
        const gOut = Number(existing.garageOutKm) || 0;
        const gIn = Number(existing.garageInKm) || 0;
        const startKmVal = Number(existing.startKm) || rollingKm;
        const gKm = existing.garageKm !== undefined && existing.garageKm !== null
          ? Number(existing.garageKm)
          : computeGarageKm(gOut, gIn, startKmVal, startKmVal + kmVal);
        const endKmVal = (existing.endKm !== undefined && existing.endKm !== null && Number(existing.endKm) >= startKmVal)
          ? Number(existing.endKm)
          : (startKmVal + kmVal);

        const extraDutyAmt = Number(existing.extraDutyCharges) || 0;

        const dayTotal = isOff ? 0 : computeRowTotal(
          kmVal,
          hrsVal,
          extraHrs,
          Number(existing.nightCharges) || 0,
          Number(existing.parkingCharges) || 0,
          Number(existing.tollCharges) || 0,
          Number(existing.driverBatta) || 0,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          extraDutyAmt,
          calcMode
        );

        generatedRows.push({
          dayNumber: day,
          dateStr,
          dayName,
          isSunday,
          isOffDay: isOff,
          dutySlipNo: existing.dutySlipNo || defaultSlipNo,
          route: existing.route || (isSunday ? 'Sunday Off / Garage Maintenance' : 'Local Corporate Movement'),
          extraDuty: existing.extraDuty || (isOff ? 'Day Off' : 'Regular Duty'),
          extraDutyCharges: extraDutyAmt,
          startKm: startKmVal,
          endKm: endKmVal,
          totalKm: kmVal,
          garageOutKm: gOut,
          garageInKm: gIn,
          garageKm: gKm,
          startTime: existing.startTime || (isOff ? '' : '08:30'),
          endTime: existing.endTime || (isOff ? '' : '18:30'),
          totalHours: hrsVal,
          extraHours: extraHrs,
          overtimeCharges: otCost,
          nightCharges: Number(existing.nightCharges) || 0,
          parkingCharges: Number(existing.parkingCharges) || 0,
          tollCharges: Number(existing.tollCharges) || 0,
          driverBatta: Number(existing.driverBatta) || 0,
          dayTotalAmount: dayTotal,
          notes: existing.notes || '',
        });
        rollingKm = endKmVal;
      } else {
        const isOff = isSunday;
        const start = rollingKm;
        const run = isOff ? 0 : carDefaultKm;
        const end = start + run;
        rollingKm = end;
        const hrsVal = isOff ? 0 : carDefaultHours;
        const extraHrs = isOff ? 0 : Math.max(0, hrsVal - defaultDutyHours);
        const otCost = isOff ? 0 : extraHrs * overtimeRatePerHour;
        const gOut = isOff ? 0 : (showGarageInOut ? Math.round((defaultGarageKm / 2) * 10) / 10 : 0);
        const gIn = isOff ? 0 : (showGarageInOut ? Math.round((defaultGarageKm / 2) * 10) / 10 : 0);
        const gKm = isOff ? 0 : (showGarageInOut ? defaultGarageKm : 0);

        const dayTotal = isOff ? 0 : computeRowTotal(
          run,
          hrsVal,
          extraHrs,
          0,
          0,
          0,
          0,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          0,
          calcMode
        );

        generatedRows.push({
          dayNumber: day,
          dateStr,
          dayName,
          isSunday,
          isOffDay: isOff,
          dutySlipNo: defaultSlipNo,
          route: isOff ? 'Sunday Off / Garage Maintenance' : 'Local Corporate Movement & Office Duty',
          extraDuty: isOff ? 'Day Off' : 'Regular Duty',
          extraDutyCharges: 0,
          startKm: start,
          endKm: end,
          totalKm: run,
          garageOutKm: gOut,
          garageInKm: gIn,
          garageKm: gKm,
          startTime: isOff ? '' : '08:30',
          endTime: isOff ? '' : '18:30',
          totalHours: hrsVal,
          extraHours: extraHrs,
          overtimeCharges: otCost,
          nightCharges: 0,
          parkingCharges: 0,
          tollCharges: 0,
          driverBatta: 0,
          dayTotalAmount: dayTotal,
          notes: '',
        });
      }
    }

    setRows(generatedRows);
  }, [selectedYear, selectedMonth, selectedVehicleId, dutySlips, defaultBaseKm, defaultDutyHours, ratePerKm, overtimeRatePerHour, garageRatePerKm, calcMode, showGarageInOut, defaultGarageKm]);

  // Helper to re-evaluate rows with cumulative slab distribution (e.g. 2000 KM @ ₹19, excess @ ₹12)
  const recalculateRowsWithCumulativeSlab = useCallback((
    rawRows: DailyRowData[],
    enabled: boolean = isTieredKmEnabled,
    threshold: number = tier1KmThreshold,
    t1Rate: number = tier1RatePerKm,
    t2Rate: number = tier2RatePerKm,
    baseKmRate: number = ratePerKm,
    otRate: number = overtimeRatePerHour,
    garageRate: number = garageRatePerKm,
    baseDutyHrs: number = defaultDutyHours,
    baseDutyKm: number = defaultBaseKm,
    mode: 'both_km_and_overtime' | 'highest_extra' = calcMode,
    enableGarage: boolean = showGarageInOut
  ): DailyRowData[] => {
    let cumulativeKm = 0;
    return rawRows.map(row => {
      if (row.isOffDay || (row.totalKm || 0) === 0) {
        return {
          ...row,
          dayTotalAmount: 0
        };
      }

      const run = Number(row.totalKm) || 0;
      let effectiveKmRate = baseKmRate;

      if (enabled) {
        const startCum = cumulativeKm;
        const endCum = startCum + run;
        cumulativeKm = endCum;

        const kmInT1 = Math.max(0, Math.min(endCum, threshold) - Math.min(startCum, threshold));
        const kmInT2 = Math.max(0, endCum - Math.max(startCum, threshold));
        const kmCost = (kmInT1 * t1Rate) + (kmInT2 * t2Rate);
        effectiveKmRate = run > 0 ? (kmCost / run) : t1Rate;
      }

      const otHrs = Number(row.extraHours) || 0;
      const otCost = otHrs * otRate;
      const gKm = enableGarage ? (Number(row.garageKm) || 0) : 0;
      const total = computeRowTotal(
        run,
        row.totalHours,
        otHrs,
        Number(row.nightCharges) || 0,
        Number(row.parkingCharges) || 0,
        Number(row.tollCharges) || 0,
        Number(row.driverBatta) || 0,
        effectiveKmRate,
        otRate,
        baseDutyHrs,
        baseDutyKm,
        gKm,
        garageRate,
        Number(row.extraDutyCharges) || 0,
        mode,
        enableGarage
      );

      return {
        ...row,
        overtimeCharges: otCost,
        dayTotalAmount: total
      };
    });
  }, [isTieredKmEnabled, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm, ratePerKm, overtimeRatePerHour, garageRatePerKm, defaultDutyHours, defaultBaseKm, calcMode, showGarageInOut]);

  // Apply Dynamic Tiered / Slab KM Calculation across all days and auto-save
  const applyTieredSlabCalculation = (
    enabled: boolean = true,
    threshold: number = tier1KmThreshold,
    t1Rate: number = tier1RatePerKm,
    t2Rate: number = tier2RatePerKm
  ) => {
    setIsTieredKmEnabled(enabled);
    setTier1KmThreshold(threshold);
    setTier1RatePerKm(t1Rate);
    setTier2RatePerKm(t2Rate);

    setRows(prev => {
      const updated = recalculateRowsWithCumulativeSlab(
        prev,
        enabled,
        threshold,
        t1Rate,
        t2Rate,
        ratePerKm,
        overtimeRatePerHour,
        garageRatePerKm,
        defaultDutyHours,
        defaultBaseKm,
        calcMode,
        showGarageInOut
      );
      triggerRealtimeAutoSave(updated);
      return updated;
    });

    setSaveSuccessMsg(
      enabled
        ? `⚡ Slab KM Active: First ${threshold.toLocaleString()} KM @ ₹${t1Rate}, excess @ ₹${t2Rate}/KM. Auto-saved to Database!`
        : `Slab KM disabled. Reverted to standard rate (@ ₹${ratePerKm}/KM).`
    );
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Recalculate row totals if user changes ratePerKm, overtimeRatePerHour, garageRatePerKm, defaultDutyHours, defaultBaseKm, calcMode, or showGarageInOut
  useEffect(() => {
    if (isTieredKmEnabled) {
      setRows(prev => recalculateRowsWithCumulativeSlab(
        prev,
        true,
        tier1KmThreshold,
        tier1RatePerKm,
        tier2RatePerKm,
        ratePerKm,
        overtimeRatePerHour,
        garageRatePerKm,
        defaultDutyHours,
        defaultBaseKm,
        calcMode,
        showGarageInOut
      ));
      return;
    }
    setRows(prev => prev.map(row => {
      if (row.isOffDay) return row;
      const otCost = (row.extraHours || 0) * overtimeRatePerHour;
      const total = computeRowTotal(
        row.totalKm,
        row.totalHours,
        row.extraHours,
        row.nightCharges,
        row.parkingCharges,
        row.tollCharges,
        row.driverBatta,
        ratePerKm,
        overtimeRatePerHour,
        defaultDutyHours,
        defaultBaseKm,
        row.garageKm || 0,
        garageRatePerKm,
        row.extraDutyCharges || 0,
        calcMode,
        showGarageInOut
      );
      return { 
        ...row, 
        overtimeCharges: otCost, 
        dayTotalAmount: total 
      };
    }));
  }, [isTieredKmEnabled, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm, ratePerKm, overtimeRatePerHour, garageRatePerKm, defaultDutyHours, defaultBaseKm, calcMode, showGarageInOut, recalculateRowsWithCumulativeSlab]);

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
          baseDutyHours: defaultDutyHours
        });

        row.totalKm = metrics.totalKm;
        row.totalHours = metrics.totalHours;
        row.extraHours = Math.max(0, metrics.totalHours - defaultDutyHours);
        row.overtimeCharges = row.extraHours * overtimeRatePerHour;
      }

      if (field === 'totalKm') {
        const kmVal = Number(val) || 0;
        row.totalKm = kmVal;
        row.endKm = (row.startKm || 0) + kmVal;
      }

      if (field === 'totalHours') {
        const hrs = Number(val) || 0;
        row.totalHours = hrs;
        row.extraHours = Math.max(0, hrs - defaultDutyHours);
        row.overtimeCharges = row.extraHours * overtimeRatePerHour;
      }

      if (field === 'extraHours') {
        const otVal = Number(val) || 0;
        row.extraHours = otVal;
        row.overtimeCharges = otVal * overtimeRatePerHour;
      }

      if (field === 'extraDuty') {
        row.extraDuty = String(val);
      }

      if (field === 'extraDutyCharges') {
        row.extraDutyCharges = Number(val) || 0;
      }

      if (field === 'garageOutKm' || field === 'garageInKm') {
        const gOut = Number(field === 'garageOutKm' ? val : row.garageOutKm) || 0;
        const gIn = Number(field === 'garageInKm' ? val : row.garageInKm) || 0;
        row.garageOutKm = gOut;
        row.garageInKm = gIn;
        row.garageKm = computeGarageKm(gOut, gIn, row.startKm, row.endKm);
      }

      if (field === 'startKm' || field === 'endKm') {
        if (row.garageOutKm || row.garageInKm) {
          row.garageKm = computeGarageKm(row.garageOutKm, row.garageInKm, row.startKm, row.endKm);
        }
      }

      // Re-calculate day total using the active calculation mode!
      row.dayTotalAmount = row.isOffDay ? 0 : computeRowTotal(
        row.totalKm,
        row.totalHours,
        row.extraHours,
        Number(row.nightCharges) || 0,
        Number(row.parkingCharges) || 0,
        Number(row.tollCharges) || 0,
        Number(row.driverBatta) || 0,
        ratePerKm,
        overtimeRatePerHour,
        defaultDutyHours,
        defaultBaseKm,
        row.garageKm || 0,
        garageRatePerKm,
        Number(row.extraDutyCharges) || 0,
        calcMode
      );

      copy[index] = row;
      if (isTieredKmEnabled) {
        const finalRows = recalculateRowsWithCumulativeSlab(
          copy,
          true,
          tier1KmThreshold,
          tier1RatePerKm,
          tier2RatePerKm,
          ratePerKm,
          overtimeRatePerHour,
          garageRatePerKm,
          defaultDutyHours,
          defaultBaseKm,
          calcMode,
          showGarageInOut
        );
        triggerRealtimeAutoSave(finalRows);
        return finalRows;
      }
      triggerRealtimeAutoSave(copy);
      return copy;
    });
  };

  // Toggle calculation mode (Dual Mode: Both KM & OT vs Previous Logic: Highest Extra)
  const handleToggleCalcMode = (mode?: 'both_km_and_overtime' | 'highest_extra') => {
    const newMode = mode || (calcMode === 'both_km_and_overtime' ? 'highest_extra' : 'both_km_and_overtime');
    setCalcMode(newMode);
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.isOffDay) return row;
        const total = computeRowTotal(
          row.totalKm,
          row.totalHours,
          row.extraHours,
          row.nightCharges,
          row.parkingCharges,
          row.tollCharges,
          row.driverBatta,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          row.garageKm || 0,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          newMode
        );
        return {
          ...row,
          dayTotalAmount: total,
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
    setSaveSuccessMsg(
      newMode === 'both_km_and_overtime'
        ? '⚡ Activated Dual Mode: Both KM & Overtime calculated together!'
        : '⚙️ Switched to Previous Logic: Base Package + Highest Extra (KM vs OT)!'
    );
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // One-click recalculation of all Overtime charges
  const handleRecalculateOvertime = () => {
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.isOffDay) return row;
        const otHrs = Math.max(0, (row.totalHours || 0) - defaultDutyHours);
        const otCost = otHrs * overtimeRatePerHour;
        const total = computeRowTotal(
          row.totalKm,
          row.totalHours,
          otHrs,
          row.nightCharges,
          row.parkingCharges,
          row.tollCharges,
          row.driverBatta,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          row.garageKm || 0,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          calcMode
        );
        return {
          ...row,
          extraHours: otHrs,
          overtimeCharges: otCost,
          dayTotalAmount: total,
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
    setSaveSuccessMsg(`⏱️ Recalculated Overtime (@ ₹${overtimeRatePerHour}/hr) for all active days!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // One-click recalculation of all KM charges
  const handleRecalculateKm = () => {
    if (isTieredKmEnabled) {
      applyTieredSlabCalculation(true, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm);
      return;
    }
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.isOffDay) return row;
        const run = Math.max(0, (row.endKm || 0) - (row.startKm || 0)) || row.totalKm;
        const gKm = computeGarageKm(row.garageOutKm, row.garageInKm, row.startKm, row.endKm);
        const total = computeRowTotal(
          run,
          row.totalHours,
          row.extraHours,
          row.nightCharges,
          row.parkingCharges,
          row.tollCharges,
          row.driverBatta,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          calcMode
        );
        return {
          ...row,
          totalKm: run,
          garageKm: gKm,
          dayTotalAmount: total,
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
    setSaveSuccessMsg(`🚗 Recalculated KM run (@ ₹${ratePerKm}/KM) for all active days!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // One-click recalculation of all Garage KM charges
  const handleRecalculateGarage = () => {
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.isOffDay) return row;
        const gKm = computeGarageKm(row.garageOutKm, row.garageInKm, row.startKm, row.endKm);
        const total = computeRowTotal(
          row.totalKm,
          row.totalHours,
          row.extraHours,
          row.nightCharges,
          row.parkingCharges,
          row.tollCharges,
          row.driverBatta,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          calcMode
        );
        return {
          ...row,
          garageKm: gKm,
          dayTotalAmount: total,
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
    setSaveSuccessMsg(`🚗 Recalculated Garage distance (@ ₹${garageRatePerKm}/KM) for all active days!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Toggle Garage In and Out columns with smart default allocation
  const handleToggleGarageInOut = (enable?: boolean) => {
    const nextState = enable !== undefined ? enable : !showGarageInOut;
    setShowGarageInOut(nextState);

    // If enabling and all active rows currently have 0 garage KM, auto-fill default garage distance
    if (nextState) {
      const allZero = rows.filter(r => !r.isOffDay).every(r => (Number(r.garageKm) || 0) === 0 && (Number(r.garageOutKm) || 0) === 0);
      if (allZero) {
        const half = Math.round((defaultGarageKm / 2) * 10) / 10;
        setRows(prev => prev.map(row => {
          if (row.isOffDay) return row;
          const gOut = half;
          const gIn = half;
          const gKm = defaultGarageKm;
          const total = computeRowTotal(
            row.totalKm,
            row.totalHours,
            row.extraHours,
            Number(row.nightCharges) || 0,
            Number(row.parkingCharges) || 0,
            Number(row.tollCharges) || 0,
            Number(row.driverBatta) || 0,
            ratePerKm,
            overtimeRatePerHour,
            defaultDutyHours,
            defaultBaseKm,
            gKm,
            garageRatePerKm,
            row.extraDutyCharges || 0,
            calcMode
          );
          return {
            ...row,
            garageOutKm: gOut,
            garageInKm: gIn,
            garageKm: gKm,
            dayTotalAmount: total,
          };
        }));
        setSaveSuccessMsg(`🚗 Garage In/Out Columns Enabled with default ${defaultGarageKm} KM run (${half} Out + ${half} In @ ₹${garageRatePerKm}/KM)!`);
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    }
  };

  // Apply Default Garage Run to all active duty rows
  const handleApplyGarageKmToAllRows = (customKm?: number) => {
    const targetKm = customKm !== undefined ? customKm : defaultGarageKm;
    const half = Math.round((targetKm / 2) * 10) / 10;
    setRows(prev => {
      const updated = prev.map(row => {
        if (row.isOffDay) return row;
        const gOut = half;
        const gIn = half;
        const gKm = targetKm;
        const total = computeRowTotal(
          row.totalKm,
          row.totalHours,
          row.extraHours,
          Number(row.nightCharges) || 0,
          Number(row.parkingCharges) || 0,
          Number(row.tollCharges) || 0,
          Number(row.driverBatta) || 0,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          calcMode
        );
        return {
          ...row,
          garageOutKm: gOut,
          garageInKm: gIn,
          garageKm: gKm,
          dayTotalAmount: total,
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
    setShowGarageInOut(true);
    setSaveSuccessMsg(`🚗 Applied ${targetKm} KM Garage Run (${half} Out + ${half} In @ ₹${garageRatePerKm}/KM) to all duty days!`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // Auto Chain all KM entries from Day 1 to Day N using default package
  const handleChainOdometer = () => {
    setRows(prev => {
      let currentKm = initialStartKm;
      const targetKm = defaultBaseKm || 100;
      const targetHours = defaultDutyHours || 10;
      const updated = prev.map(row => {
        if (row.isOffDay) {
          return {
            ...row,
            startKm: currentKm,
            endKm: currentKm,
            totalKm: 0,
            totalHours: 0,
            extraHours: 0,
            overtimeCharges: 0,
            garageOutKm: 0,
            garageInKm: 0,
            garageKm: 0,
            dayTotalAmount: 0
          };
        }
        const start = currentKm;
        const km = row.totalKm > 0 ? row.totalKm : targetKm;
        const end = start + km;
        currentKm = end;
        
        const hrs = row.totalHours > 0 ? row.totalHours : targetHours;
        const extraHrs = Math.max(0, hrs - defaultDutyHours);
        const otCost = extraHrs * overtimeRatePerHour;
        const gKm = row.garageKm || computeGarageKm(row.garageOutKm, row.garageInKm, start, end);
        const total = computeRowTotal(
          km,
          hrs,
          extraHrs,
          row.nightCharges,
          row.parkingCharges,
          row.tollCharges,
          row.driverBatta,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          calcMode
        );

        return {
          ...row,
          startKm: start,
          endKm: end,
          totalKm: km,
          totalHours: hrs,
          extraHours: extraHrs,
          overtimeCharges: otCost,
          garageKm: gKm,
          dayTotalAmount: total
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
  };

  // Fill all 30 days as active continuous duty with car's default package (e.g. 100 KM)
  const handleFillAllDaysActive = (includeSundays = true) => {
    setRows(prev => {
      let currentKm = initialStartKm;
      const targetKm = defaultBaseKm || 100;
      const targetHours = defaultDutyHours || 10;
      const half = Math.round((defaultGarageKm / 2) * 10) / 10;

      const updated = prev.map(row => {
        const isOff = !includeSundays && row.isSunday;
        const start = currentKm;
        const run = isOff ? 0 : targetKm;
        const end = start + run;
        currentKm = end;
        const hrs = isOff ? 0 : targetHours;

        const extraHrs = isOff ? 0 : Math.max(0, hrs - defaultDutyHours);
        const otCost = extraHrs * overtimeRatePerHour;
        const gOut = isOff ? 0 : (row.garageOutKm || (showGarageInOut ? half : 0));
        const gIn = isOff ? 0 : (row.garageInKm || (showGarageInOut ? half : 0));
        const gKm = isOff ? 0 : (row.garageKm || (showGarageInOut ? defaultGarageKm : computeGarageKm(gOut, gIn, start, end)));

        const total = isOff ? 0 : computeRowTotal(
          run,
          hrs,
          extraHrs,
          0,
          0,
          0,
          0,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          0,
          calcMode
        );

        return {
          ...row,
          isOffDay: isOff,
          route: isOff ? 'Sunday Off / Garage Day' : 'Local Corporate Movement & Office Duty',
          extraDuty: isOff ? 'Day Off' : 'Regular Duty',
          extraDutyCharges: 0,
          startKm: start,
          endKm: end,
          totalKm: run,
          garageOutKm: gOut,
          garageInKm: gIn,
          garageKm: gKm,
          startTime: isOff ? '' : '08:30',
          endTime: isOff ? '' : '18:30',
          totalHours: hrs,
          extraHours: extraHrs,
          overtimeCharges: otCost,
          dayTotalAmount: total
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });
  };

  // Apply car's default package (e.g. 100 KM & 10h) to all active duty rows
  const handleApplyCarPackageToAllRows = () => {
    const targetKm = defaultBaseKm || 100;
    const targetHours = defaultDutyHours || 10;
    let currentKm = initialStartKm;

    setRows(prev => {
      const updated = prev.map(row => {
        if (row.isOffDay) {
          return {
            ...row,
            startKm: currentKm,
            endKm: currentKm,
            totalKm: 0,
            totalHours: 0,
            extraHours: 0,
            overtimeCharges: 0,
            dayTotalAmount: 0
          };
        }

        const start = currentKm;
        const end = start + targetKm;
        currentKm = end;

        const extraHrs = Math.max(0, targetHours - defaultDutyHours);
        const otCost = extraHrs * overtimeRatePerHour;
        const gKm = row.garageKm || computeGarageKm(row.garageOutKm, row.garageInKm, start, end);
        const total = computeRowTotal(
          targetKm,
          targetHours,
          extraHrs,
          Number(row.nightCharges) || 0,
          Number(row.parkingCharges) || 0,
          Number(row.tollCharges) || 0,
          Number(row.driverBatta) || 0,
          ratePerKm,
          overtimeRatePerHour,
          defaultDutyHours,
          defaultBaseKm,
          gKm,
          garageRatePerKm,
          row.extraDutyCharges || 0,
          calcMode
        );

        return {
          ...row,
          startKm: start,
          endKm: end,
          totalKm: targetKm,
          totalHours: targetHours,
          extraHours: extraHrs,
          overtimeCharges: otCost,
          garageKm: gKm,
          dayTotalAmount: total
        };
      });
      triggerRealtimeAutoSave(updated);
      return updated;
    });

    setSaveSuccessMsg(`Applied car default run (${targetKm} KM / ${targetHours}h) to all active rows!`);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Toggle Day Off (e.g. Sunday or holiday)
  const handleToggleOffDay = (index: number) => {
    setRows(prev => {
      const copy = [...prev];
      const row = copy[index];
      const isOff = !row.isOffDay;
      const totalKm = isOff ? 0 : (row.totalKm > 0 ? row.totalKm : (defaultBaseKm || 100));
      const totalHrs = isOff ? 0 : (row.totalHours > 0 ? row.totalHours : (defaultDutyHours || 10));
      const extraHrs = isOff ? 0 : Math.max(0, totalHrs - defaultDutyHours);
      const otCost = extraHrs * overtimeRatePerHour;
      const gOut = isOff ? 0 : (row.garageOutKm || (showGarageInOut ? Math.round((defaultGarageKm / 2) * 10) / 10 : 0));
      const gIn = isOff ? 0 : (row.garageInKm || (showGarageInOut ? Math.round((defaultGarageKm / 2) * 10) / 10 : 0));
      const gKm = isOff ? 0 : (row.garageKm || computeGarageKm(gOut, gIn, row.startKm, row.startKm + totalKm));
      const total = isOff ? 0 : computeRowTotal(
        totalKm,
        totalHrs,
        extraHrs,
        isOff ? 0 : row.nightCharges,
        isOff ? 0 : row.parkingCharges,
        isOff ? 0 : row.tollCharges,
        isOff ? 0 : row.driverBatta,
        ratePerKm,
        overtimeRatePerHour,
        defaultDutyHours,
        defaultBaseKm,
        gKm,
        garageRatePerKm,
        isOff ? 0 : (row.extraDutyCharges || 0),
        calcMode
      );

      copy[index] = {
        ...row,
        isOffDay: isOff,
        route: isOff ? 'Day Off / Garage Maintenance' : 'Local Corporate Movement',
        extraDuty: isOff ? 'Day Off' : 'Regular Duty',
        extraDutyCharges: isOff ? 0 : row.extraDutyCharges,
        startKm: row.startKm,
        endKm: isOff ? row.startKm : row.startKm + totalKm,
        totalKm: totalKm,
        garageOutKm: gOut,
        garageInKm: gIn,
        garageKm: gKm,
        startTime: isOff ? '' : '08:30',
        endTime: isOff ? '' : '18:30',
        totalHours: totalHrs,
        extraHours: extraHrs,
        overtimeCharges: otCost,
        nightCharges: isOff ? 0 : row.nightCharges,
        parkingCharges: isOff ? 0 : row.parkingCharges,
        tollCharges: isOff ? 0 : row.tollCharges,
        driverBatta: isOff ? 0 : row.driverBatta,
        dayTotalAmount: total
      };
      triggerRealtimeAutoSave(copy);
      return copy;
    });
  };

  // Calculate totals and break-up values
  const totalMonthKm = rows.reduce((sum, r) => sum + (r.totalKm || 0), 0);
  const totalMonthHours = rows.reduce((sum, r) => sum + (r.totalHours || 0), 0);
  const totalMonthOvertimeHours = rows.reduce((sum, r) => sum + (Number(r.extraHours) || 0), 0);
  const totalMonthOvertimeAmount = totalMonthOvertimeHours * overtimeRatePerHour;
  const totalMonthGarageKm = showGarageInOut ? rows.reduce((sum, r) => sum + (Number(r.garageKm) || 0), 0) : 0;
  const totalMonthGarageAmount = showGarageInOut ? totalMonthGarageKm * (garageRatePerKm || ratePerKm) : 0;
  const tieredKmResult = computeTieredKmCharges(totalMonthKm, {
    enabled: isTieredKmEnabled,
    baseKmThreshold: tier1KmThreshold,
    tier1Rate: tier1RatePerKm,
    tier2Rate: tier2RatePerKm,
  });

  const totalMonthKmAmount = isTieredKmEnabled
    ? tieredKmResult.totalKmAmount
    : (totalMonthKm * ratePerKm);

  const totalMonthNight = rows.reduce((sum, r) => sum + (Number(r.nightCharges) || 0), 0);
  const totalMonthParking = rows.reduce((sum, r) => sum + (Number(r.parkingCharges) || 0), 0);
  const totalMonthToll = rows.reduce((sum, r) => sum + (Number(r.tollCharges) || 0), 0);
  const totalMonthBatta = rows.reduce((sum, r) => sum + (Number(r.driverBatta) || 0), 0);
  const totalMonthExtraDutyCharges = rows.reduce((sum, r) => sum + (Number(r.extraDutyCharges) || 0), 0);
  
  const calculatedGrandTotal = totalMonthKmAmount + totalMonthOvertimeAmount + totalMonthGarageAmount + totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta + totalMonthExtraDutyCharges;
  const grandTotalAmount = isTieredKmEnabled
    ? calculatedGrandTotal
    : rows.reduce((sum, r) => sum + (Number(r.dayTotalAmount) || 0), 0);
  const totalWorkingDays = rows.filter(r => !r.isOffDay && r.totalKm > 0).length;

  // Save all rows to AppContext duty slips and backend database in realtime
  const handleSaveAllSlips = async () => {
    if (!selectedVehicleId || !selectedClientId || rows.length === 0) return;
    setIsAutoSaving(true);
    try {
      const payloads = rows.map(r => buildSlipPayload(r));
      await batchUpsertDutySlips(payloads);
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastAutoSavedAt(timeStr);
      setSaveSuccessMsg(`⚡ Auto-saved ${rows.length} daily logs to Database in realtime! (${timeStr})`);
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to save slips to database:', err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const selectedMonthName = new Date(selectedYear, selectedMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const selectedVeh = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  const selectedCli = clients.find(c => c.id === selectedClientId);

  const handleTriggerDirectDownload = async () => {
    await handleSaveAllSlips();
    setIsDownloadingPdf(true);
    const elementId = 'bishal-sheet-preview-render-modal';
    const filename = `${company.businessName || 'BISHAL_TRAVELS'}_${selectedVeh?.regNumber || 'Vehicle'}_${selectedMonthName.replace(/\s+/g, '_')}`;

    setIsPreviewOpen(true);
    setTimeout(async () => {
      await downloadInvoiceAsPdf(elementId, filename);
      setIsDownloadingPdf(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Daily Car Run & Surcharge Sheet (1st to 31st)
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                calcMode === 'both_km_and_overtime'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-sm'
                  : 'bg-amber-950 text-amber-300 border-amber-500'
              }`}>
                {calcMode === 'both_km_and_overtime' ? '⚡ Dual Mode: Both KM & OT Active' : '⚙️ Previous Logic: Highest Extra'}
              </span>

              {isTieredKmEnabled && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border bg-cyan-950 text-cyan-300 border-cyan-500 shadow-sm flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>Slab KM: 1st {tier1KmThreshold.toLocaleString()} KM @ ₹{tier1RatePerKm}, excess @ ₹{tier2RatePerKm}</span>
                </span>
              )}

              {/* Real-time DB Auto-Save Live Badge */}
              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
                isAutoSaving
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/80 animate-pulse'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/80'
              }`}>
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                {isAutoSaving ? (
                  <span>Auto-saving to Database...</span>
                ) : lastAutoSavedAt ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Realtime Auto-saved ({lastAutoSavedAt})</span>
                  </span>
                ) : (
                  <span>Realtime Database Sync Active</span>
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {calcMode === 'both_km_and_overtime'
                ? `Dual Billing Active: Both KM (@ ₹${ratePerKm}/KM) and Overtime (@ ₹${overtimeRatePerHour}/h) are calculated together + Garage KM (@ ₹${garageRatePerKm}/KM) + Surcharges.`
                : `Previous Logic Active: Base Package (${defaultBaseKm} KM & ${defaultDutyHours}h = ₹${defaultBaseKm * ratePerKm}). Takes whichever extra charge is highest (Extra KM vs Extra OT) + Surcharges.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Calculation Mode Switch Button */}
            <button
              onClick={() => handleToggleCalcMode()}
              className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 border shadow-md transition-all ${
                calcMode === 'both_km_and_overtime'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/60'
              }`}
              title="Toggle between Dual Calculation (Both KM + OT) and Previous Logic (Highest Extra)"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{calcMode === 'both_km_and_overtime' ? '⚡ Mode: Both KM & OT (Active)' : '⚙️ Switch to Both KM & OT'}</span>
            </button>

            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Preview Official PDF</span>
            </button>

            <button
              onClick={handleTriggerDirectDownload}
              disabled={isDownloadingPdf}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
            </button>

            {/* Dynamic Print Date Input (Defaults to current printing date) */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Print Date</span>
                <input
                  type="date"
                  value={printDate}
                  onChange={e => setPrintDate(e.target.value)}
                  className="bg-transparent text-amber-300 font-mono font-bold text-xs outline-none cursor-pointer p-0"
                  title="Dynamic print date printed on the official PDF header and banking section"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Selection & Rate Settings Bar (8 Columns) */}
        <div className="grid grid-cols-2 sm:grid-cols-8 gap-2.5 pt-3 border-t border-slate-800 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Month & Year
            </label>
            <div className="flex gap-1">
              <select
                value={selectedMonth}
                onChange={e => {
                  userInteractedVehicleRef.current = true;
                  setSelectedMonth(Number(e.target.value));
                }}
                className="w-full px-1.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-bold text-xs"
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(2026, i, 1).toLocaleString('en-US', { month: 'short' })}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={e => {
                  userInteractedVehicleRef.current = true;
                  setSelectedYear(Number(e.target.value));
                }}
                className="px-1.5 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-mono font-bold text-xs"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>

          {/* Vehicle Selector with Active/Inactive Fleet Filter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] uppercase font-bold text-slate-400">
                Vehicle
              </label>
              <select
                value={vehicleStatusFilter}
                onChange={e => setVehicleStatusFilter(e.target.value as 'Active' | 'All' | 'Inactive')}
                className="bg-slate-900 text-emerald-400 text-[10px] font-bold border border-slate-700 rounded px-1 py-0.5"
                title="Filter vehicles: Active / All / Inactive"
              >
                <option value="Active">Active ({activeVehicles.length})</option>
                <option value="All">All ({vehicles.length})</option>
                <option value="Inactive">Inactive ({vehicles.length - activeVehicles.length})</option>
              </select>
            </div>
            <select
              value={selectedVehicleId}
              onChange={e => {
                userInteractedVehicleRef.current = true;
                setSelectedVehicleId(e.target.value);
              }}
              className="w-full px-2 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-mono font-bold text-xs"
            >
              {filteredVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.regNumber} ({v.model.split(' ')[0]}) {v.status !== 'Active' ? `[${v.status}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-amber-300 mb-1">
              Base KM / Day
            </label>
            <input
              type="number"
              value={defaultBaseKm}
              onChange={e => {
                const val = Number(e.target.value);
                setDefaultBaseKm(val);
                setDailyAvgKm(val);
              }}
              className="w-full px-2 py-1.5 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg font-mono font-black text-sm"
              placeholder="e.g. 100"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-amber-300 mb-1">
              Base Hours / Day
            </label>
            <input
              type="number"
              value={defaultDutyHours}
              onChange={e => setDefaultDutyHours(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-800 text-amber-300 border border-slate-700 rounded-lg font-mono font-black text-sm"
              placeholder="e.g. 10"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Rate / KM (₹)
            </label>
            <input
              type="number"
              value={ratePerKm}
              onChange={e => setRatePerKm(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-mono font-bold text-sm"
              placeholder="e.g. 18"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-emerald-300 mb-1">
              OT Rate / Hr (₹)
            </label>
            <input
              type="number"
              value={overtimeRatePerHour}
              onChange={e => setOvertimeRatePerHour(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-800 text-emerald-300 border border-slate-700 rounded-lg font-mono font-bold text-sm"
              placeholder="e.g. 90"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-blue-300 mb-1">
              Garage Rate / KM (₹)
            </label>
            <input
              type="number"
              value={garageRatePerKm}
              onChange={e => setGarageRatePerKm(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-slate-800 text-blue-300 border border-slate-700 rounded-lg font-mono font-bold text-sm"
              placeholder="e.g. 18"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Driver on Duty
            </label>
            <input
              type="text"
              value={driverName}
              onChange={e => setDriverName(e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-800 text-white border border-slate-700 rounded-lg font-medium text-xs"
              placeholder="Driver Name"
            />
          </div>
        </div>
      </div>

      {/* Real-time Cloud Sync & Saved Database Records Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs shadow-md">
        <div className="flex items-center gap-2.5">
          {matchingSlips.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-bold">
                {matchingSlips.length} Saved Duty Slips Loaded from Database
              </span>
              <span className="text-slate-400 text-[11px]">
                for {currentVeh?.regNumber || 'Vehicle'} ({new Date(selectedYear, selectedMonth, 1).toLocaleString('en-US', { month: 'long' })} {selectedYear})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400/80 shrink-0"></span>
              <span className="text-slate-300 font-medium text-xs">
                No duty slips saved yet for <strong className="text-white">{currentVeh?.regNumber}</strong> in {new Date(selectedYear, selectedMonth, 1).toLocaleString('en-US', { month: 'long' })} {selectedYear}.
              </span>
            </div>
          )}
        </div>

        {/* Quick-switch buttons for other months/vehicles present in database */}
        {availableSavedSummaries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              Saved Records in Database:
            </span>
            {availableSavedSummaries.map(s => {
              const isCurrent = s.vehicleId === selectedVehicleId && s.year === selectedYear && s.month === selectedMonth;
              return (
                <button
                  key={`${s.vehicleId}-${s.year}-${s.month}`}
                  type="button"
                  onClick={() => {
                    userInteractedVehicleRef.current = true;
                    setSelectedVehicleId(s.vehicleId);
                    setSelectedYear(s.year);
                    setSelectedMonth(s.month);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500'
                  }`}
                  title={`Switch to ${s.vehicleReg} - ${s.monthName} ${s.year}`}
                >
                  <span>{s.vehicleReg}</span>
                  <span className="text-[10px] opacity-75">({s.monthName} {s.year})</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isCurrent ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-950 text-emerald-300'
                  }`}>
                    {s.count} slips
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-sm">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Feature Buttons & Column Toggles Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Column & Feature Control Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-extrabold uppercase text-[10px] text-slate-400 tracking-wider mr-1">
              Display & Columns:
            </span>

            {/* Both KM and Overtime mode toggle button */}
            <button
              onClick={() => handleToggleCalcMode()}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                calcMode === 'both_km_and_overtime'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Click to toggle: Both KM + Overtime vs Previous Logic (Highest Extra)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Both KM & OT Calc: {calcMode === 'both_km_and_overtime' ? 'ON' : 'OFF'}</span>
            </button>

            {/* Garage In and Out KM Two Separated Columns Toggle Button */}
            <button
              onClick={() => handleToggleGarageInOut()}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                showGarageInOut
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Enable Garage Out KM and Garage In KM separated columns with auto-calculation"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Garage In/Out: {showGarageInOut ? 'ENABLED (Calc Below)' : 'OFF'}</span>
            </button>

            {/* Hide Total Price Calculate Button */}
            <button
              onClick={() => setHideTotalPrice(!hideTotalPrice)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                hideTotalPrice
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Hide or show the daily row Total Price column (Break-up remains at the end)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Daily Total Price: {hideTotalPrice ? 'HIDDEN' : 'VISIBLE'}</span>
            </button>

            {/* Overtime Column Toggle Button */}
            <button
              onClick={() => setShowOvertimeCol(!showOvertimeCol)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                showOvertimeCol
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Show or hide separated Overtime column"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Overtime Col: {showOvertimeCol ? 'SHOWN' : 'HIDDEN'}</span>
            </button>

            {/* Extra Duty Charges Column Toggle Button */}
            <button
              onClick={() => setShowExtraDutyCol(!showExtraDutyCol)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                showExtraDutyCol
                  ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Show or hide separated Extra Duty Charges (₹) column"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Extra Duty (₹): {showExtraDutyCol ? 'ENABLED' : 'OFF'}</span>
            </button>

            {/* Slab / Tiered KM Billing Button */}
            <button
              onClick={() => setIsSlabConfigOpen(!isSlabConfigOpen)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
                isTieredKmEnabled
                  ? 'bg-cyan-700 text-white border-cyan-800 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
              title="Configure Tiered / Slab KM Billing (e.g. 2000 KM @ ₹19, excess @ ₹12)"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              <span>Slab KM: {isTieredKmEnabled ? `${tier1KmThreshold}k@₹${tier1RatePerKm}, rest@₹${tier2RatePerKm}` : 'OFF'}</span>
            </button>
          </div>

          {/* Quick Recalculation Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRecalculateOvertime}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              title="Recalculate total overtime charges for all rows"
            >
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>⏱️ Recalc All Overtime</span>
            </button>

            <button
              onClick={handleRecalculateKm}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              title="Recalculate total KM charges for all rows"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-700" />
              <span>🚗 Recalc All KM</span>
            </button>

            {/* 1-Click Slab KM Recalculate Button */}
            <button
              onClick={() => applyTieredSlabCalculation(true, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors border ${
                isTieredKmEnabled
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-sm'
                  : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300'
              }`}
              title="1-Click: Dynamically calculate and apply Slab KM rates across all 30/31 days and auto-save"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-700" />
              <span>⚡ Set & Recalc Slab KM</span>
            </button>

            <button
              onClick={handleRecalculateGarage}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
              title="Recalculate total Garage charges for all rows"
            >
              <Car className="w-3.5 h-3.5 text-blue-700" />
              <span>🚗 Recalc All Garage</span>
            </button>

            {calcMode === 'both_km_and_overtime' && (
              <button
                onClick={() => handleToggleCalcMode('highest_extra')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl font-semibold text-[11px] transition-colors"
                title="Switch back to previous highest extra logic"
              >
                <span>Revert Previous Logic</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Slab KM Configuration Drawer */}
        {isSlabConfigOpen && (
          <div className="bg-slate-900 border border-cyan-600/40 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-white shadow-lg animate-fadeIn">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-black text-cyan-400 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" /> Slab KM Pricing Settings:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-bold">1st Slab KM:</span>
                <input
                  type="number"
                  value={tier1KmThreshold}
                  onChange={e => setTier1KmThreshold(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold text-center text-xs"
                  placeholder="2000"
                />
                <span className="text-slate-400 text-[10px]">KM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-bold">Slab 1 Rate:</span>
                <span className="text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  value={tier1RatePerKm}
                  onChange={e => setTier1RatePerKm(Number(e.target.value))}
                  className="w-16 px-1.5 py-1 bg-slate-800 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono font-bold text-center text-xs"
                  placeholder="19"
                />
                <span className="text-slate-400 text-[10px]">/KM</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px] font-bold">Excess Rate:</span>
                <span className="text-slate-400 text-xs">₹</span>
                <input
                  type="number"
                  value={tier2RatePerKm}
                  onChange={e => setTier2RatePerKm(Number(e.target.value))}
                  className="w-16 px-1.5 py-1 bg-slate-800 border border-amber-500/60 rounded-lg text-amber-300 font-mono font-bold text-center text-xs"
                  placeholder="12"
                />
                <span className="text-slate-400 text-[10px]">/KM</span>
              </div>
              <button
                onClick={() => applyTieredSlabCalculation(true, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm)}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl flex items-center gap-1.5 shadow transition-all border border-cyan-400 hover:scale-105"
                title="Dynamically calculate & apply slab rate across all 30/31 days and auto-save"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>⚡ Apply Slab to All Rows & Calculate</span>
              </button>
              {isTieredKmEnabled && (
                <button
                  onClick={() => applyTieredSlabCalculation(false)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/60 rounded-xl font-semibold text-xs"
                >
                  Turn Off Slab
                </button>
              )}
            </div>
            <div className="text-[11px] font-mono text-cyan-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              Formula: (First {tier1KmThreshold} KM × ₹{tier1RatePerKm}) + (Excess KM × ₹{tier2RatePerKm})
            </div>
          </div>
        )}

        {/* Auto-Fill Row Helpers */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
              <span className="font-bold text-slate-700">Default Run:</span>
              <input
                type="number"
                value={dailyAvgKm}
                onChange={e => setDailyAvgKm(Number(e.target.value))}
                className="w-20 px-2 py-1 border border-slate-300 rounded-lg font-mono font-bold"
              />
              <span className="text-slate-500">KM</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Garage:</span>
              <input
                type="number"
                value={defaultGarageKm}
                onChange={e => setDefaultGarageKm(Number(e.target.value))}
                className="w-16 px-1.5 py-1 border border-blue-300 rounded-lg font-mono font-bold bg-blue-50/50 text-blue-950 text-center text-xs"
                placeholder="20"
              />
              <span className="text-slate-500 text-[11px]">KM</span>
            </div>

            <button
              onClick={() => handleApplyGarageKmToAllRows()}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title={`Apply ${defaultGarageKm} KM Garage Run (${defaultGarageKm / 2} Out + ${defaultGarageKm / 2} In) to all active duty days`}
            >
              <Car className="w-3.5 h-3.5 text-blue-700" />
              <span>⚡ Apply {defaultGarageKm} KM Garage</span>
            </button>

            <button
              onClick={handleChainOdometer}
              className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title="Automatically connects each day's Start KM to previous day's End KM"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Chain KM</span>
            </button>

            <button
              onClick={handleApplyCarPackageToAllRows}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title={`Set every active day to car's default ${defaultBaseKm} KM run`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>⚡ Apply {defaultBaseKm} KM Default</span>
            </button>

            <button
              onClick={() => handleFillAllDaysActive(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              title={`Fill all 30/31 days with ${defaultBaseKm} KM run`}
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
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {calcMode === 'both_km_and_overtime'
                ? `Dual Calculation: Total KM (@ ₹${ratePerKm}/KM) + Overtime (@ ₹${overtimeRatePerHour}/h) + Garage In/Out (@ ₹${garageRatePerKm}/KM) + Extras.`
                : `Previous Logic: Base ${defaultBaseKm} KM & ${defaultDutyHours}h = ₹${defaultBaseKm * ratePerKm}. Extra: Takes highest of Extra KM vs Extra OT.`}
            </span>
          </div>
        </div>
      </div>

      {/* Clean Full Month Spreadsheet Table (1st to 31st) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
          <table 
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                flushAutoSave();
              }
            }}
            className="w-full text-left border-collapse text-xs"
          >
            <thead className="sticky top-0 z-20 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-2.5 w-14 text-center border-r border-slate-700">Day / Date</th>
                <th className="py-2.5 px-2 w-18 border-r border-slate-700">Slip No</th>
                <th className="py-2.5 px-2.5 border-r border-slate-700">Route & Duty Particulars</th>
                {showExtraDutyCol && (
                  <th className="py-2.5 px-2 w-24 text-right border-r border-slate-700 bg-purple-950 text-purple-200" title="Extra Duty Surcharges (₹)">
                    Extra Duty (₹)
                  </th>
                )}
                {showGarageInOut && (
                  <>
                    <th className="py-2.5 px-1.5 w-20 text-center border-r border-slate-700 bg-blue-950 text-blue-200">
                      Garage Out (KM)
                    </th>
                    <th className="py-2.5 px-1.5 w-20 text-center border-r border-slate-700 bg-blue-950 text-blue-200">
                      Garage In (KM)
                    </th>
                  </>
                )}
                <th className="py-2.5 px-1.5 w-20 text-center border-r border-slate-700">Start KM</th>
                <th className="py-2.5 px-1.5 w-20 text-center border-r border-slate-700">End KM</th>
                <th className="py-2.5 px-1.5 w-18 text-center border-r border-slate-700">Run (KM)</th>
                <th className="py-2.5 px-1.5 w-16 text-center border-r border-slate-700">Start Time</th>
                <th className="py-2.5 px-1.5 w-16 text-center border-r border-slate-700">End Time</th>
                <th className="py-2.5 px-1.5 w-14 text-center border-r border-slate-700">Hours</th>
                {showOvertimeCol && (
                  <th className="py-2.5 px-1.5 w-20 text-center border-r border-slate-700 bg-amber-950 text-amber-200">
                    Overtime (Hrs)
                  </th>
                )}
                <th className="py-2.5 px-1.5 w-20 text-right border-r border-slate-700">Night (₹)</th>
                <th className="py-2.5 px-1.5 w-20 text-right border-r border-slate-700">Park (₹)</th>
                <th className="py-2.5 px-1.5 w-20 text-right border-r border-slate-700">Toll (₹)</th>
                <th className="py-2.5 px-1.5 w-20 text-right border-r border-slate-700">Batta (₹)</th>
                {!hideTotalPrice && (
                  <th className="py-2.5 px-2.5 w-28 text-right border-r border-slate-700 bg-emerald-950 text-emerald-300">Total (₹)</th>
                )}
                <th className="py-2.5 px-1.5 w-12 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
              {rows.map((row, idx) => {
                const isSun = row.isSunday;
                const isOff = row.isOffDay;
                const hasOt = row.extraHours > 0;
                const hasExtraKm = row.totalKm > defaultBaseKm;

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
                    <td className="py-1.5 px-2 text-center border-r border-slate-200 font-mono">
                      <div className="font-bold text-slate-900 text-xs">
                        {String(row.dayNumber).padStart(2, '0')}
                      </div>
                      <div className={`text-[10px] font-semibold ${isSun ? 'text-amber-600' : 'text-slate-500'}`}>
                        {row.dayName}
                      </div>
                    </td>

                    {/* Slip No */}
                    <td className="py-1.5 px-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row.dutySlipNo}
                        onChange={e => handleRowChange(idx, 'dutySlipNo', e.target.value)}
                        className="w-full px-1 py-1 text-[11px] font-mono border border-slate-200 rounded bg-white"
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
                          title="Toggle Day Off (Will hide row from report)"
                        >
                          {isOff ? 'OFF' : 'ON'}
                        </button>
                      </div>
                    </td>

                    {/* Extra Duty Charges Column */}
                    {showExtraDutyCol && (
                      <td className="py-1.5 px-1 border-r border-slate-200 bg-purple-50/20 text-right">
                        <input
                          type="number"
                          value={row.extraDutyCharges || ''}
                          onChange={e => handleRowChange(idx, 'extraDutyCharges', e.target.value)}
                          className="w-full px-1 py-1 text-xs font-mono font-bold text-right border border-purple-200 rounded bg-white text-purple-900 focus:ring-2 focus:ring-purple-500"
                          placeholder="₹"
                          disabled={isOff}
                        />
                      </td>
                    )}

                    {/* Garage Out and Garage In KM Two Separated Columns */}
                    {showGarageInOut && (
                      <>
                        <td className="py-1.5 px-1 border-r border-slate-200 text-center bg-blue-50/20">
                          <input
                            type="number"
                            value={row.garageOutKm || ''}
                            onChange={e => handleRowChange(idx, 'garageOutKm', e.target.value)}
                            placeholder="Out"
                            className="w-full px-1 py-1 text-xs font-mono font-bold text-center border border-blue-200 rounded bg-white text-blue-900"
                            disabled={isOff}
                          />
                        </td>
                        <td className="py-1.5 px-1 border-r border-slate-200 text-center bg-blue-50/20">
                          <div className="flex flex-col items-center">
                            <input
                              type="number"
                              value={row.garageInKm || ''}
                              onChange={e => handleRowChange(idx, 'garageInKm', e.target.value)}
                              placeholder="In"
                              className="w-full px-1 py-1 text-xs font-mono font-bold text-center border border-blue-200 rounded bg-white text-blue-900"
                              disabled={isOff}
                            />
                            {((Number(row.garageKm) || 0) > 0 || (Number(row.garageOutKm) || 0) > 0 || (Number(row.garageInKm) || 0) > 0) && !isOff && (
                              <span className="text-[9px] font-mono font-bold text-blue-700 leading-none mt-0.5" title="Total Garage Run for this day">
                                ={row.garageKm || 0} KM
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* Start KM */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        value={row.startKm}
                        onChange={e => handleRowChange(idx, 'startKm', e.target.value)}
                        className="w-full px-1 py-1 text-xs font-mono font-bold text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* End KM */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="number"
                        value={row.endKm}
                        onChange={e => handleRowChange(idx, 'endKm', e.target.value)}
                        className="w-full px-1 py-1 text-xs font-mono font-bold text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* Total KM Run (Directly Editable) */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={row.totalKm || ''}
                          onChange={e => handleRowChange(idx, 'totalKm', e.target.value)}
                          placeholder="KM"
                          className="w-full px-1 py-1 text-xs font-mono font-black text-center border border-emerald-300 rounded bg-emerald-50 text-emerald-950 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                          disabled={isOff}
                        />
                        {hasExtraKm && !isOff && (
                          <span className="text-[9px] font-bold text-emerald-700 leading-none mt-0.5">
                            +{row.totalKm - defaultBaseKm} KM extra
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Start Time */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="time"
                        value={row.startTime}
                        onChange={e => handleRowChange(idx, 'startTime', e.target.value)}
                        className="w-full px-0.5 py-1 text-[11px] font-mono text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* End Time */}
                    <td className="py-1.5 px-1 border-r border-slate-200 text-center">
                      <input
                        type="time"
                        value={row.endTime}
                        onChange={e => handleRowChange(idx, 'endTime', e.target.value)}
                        className="w-full px-0.5 py-1 text-[11px] font-mono text-center border border-slate-200 rounded bg-white"
                        disabled={isOff}
                      />
                    </td>

                    {/* Total Hours (Directly Editable) */}
                    <td className="py-1.5 px-1 text-center border-r border-slate-200">
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          step="0.5"
                          value={row.totalHours || ''}
                          onChange={e => handleRowChange(idx, 'totalHours', e.target.value)}
                          placeholder="Hrs"
                          className="w-full px-1 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                          disabled={isOff}
                        />
                        {hasOt && !isOff && (
                          <span className="text-[9px] font-bold text-amber-600 leading-none mt-0.5" title={`+${row.extraHours}h Overtime beyond ${defaultDutyHours}h`}>
                            +{row.extraHours}h OT
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Separated Editable Overtime Column */}
                    {showOvertimeCol && (
                      <td className="py-1.5 px-1 text-center border-r border-slate-200 bg-amber-50/30">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            step="0.5"
                            value={row.extraHours ?? ''}
                            onChange={e => handleRowChange(idx, 'extraHours', e.target.value)}
                            placeholder="OT"
                            className="w-full px-1 py-1 text-xs font-mono font-bold text-center border border-amber-300 rounded bg-amber-50 text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500"
                            disabled={isOff}
                          />
                          {row.overtimeCharges > 0 && !isOff && (
                            <span className="text-[9px] font-bold text-amber-700 leading-none mt-0.5">
                              ₹{row.overtimeCharges}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Night Charges */}
                    <td className="py-1.5 px-1 border-r border-slate-200">
                      <input
                        type="number"
                        value={row.nightCharges || ''}
                        onChange={e => handleRowChange(idx, 'nightCharges', e.target.value)}
                        placeholder="₹"
                        className="w-full px-1 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-amber-800 font-bold"
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
                        className="w-full px-1 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-blue-800 font-bold"
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
                        className="w-full px-1 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-blue-800 font-bold"
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
                        className="w-full px-1 py-1 text-xs font-mono text-right border border-slate-200 rounded bg-white text-purple-800 font-bold"
                        disabled={isOff}
                      />
                    </td>

                    {/* Calculated Day Total Amount (Base Package + Highest of Extra KM vs Extra Hours + Surcharges) */}
                    {!hideTotalPrice && (
                      <td className="py-1.5 px-2.5 text-right border-r border-slate-200 font-mono font-black text-slate-900 bg-emerald-50/70 text-xs">
                        {isOff ? '-' : `₹${row.dayTotalAmount.toLocaleString('en-IN')}`}
                      </td>
                    )}

                    {/* Status Pill */}
                    <td className="py-1.5 px-1.5 text-center text-[10px]">
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
                  Monthly Total ({totalWorkingDays} Duty Days):
                </td>
                {showExtraDutyCol && (
                  <td className="py-2 px-1 text-right font-mono font-bold text-purple-300 text-xs bg-purple-950/60 border-r border-purple-800" title={`Total Extra Duty Charges: ₹${totalMonthExtraDutyCharges.toLocaleString('en-IN')}`}>
                    {totalMonthExtraDutyCharges > 0 ? `₹${totalMonthExtraDutyCharges.toLocaleString('en-IN')}` : '-'}
                  </td>
                )}
                {showGarageInOut && (
                  <td colSpan={2} className="py-2 px-1 text-center font-mono font-bold text-blue-300 text-xs bg-blue-950/60 border-x border-blue-800" title={`Garage In/Out: ${totalMonthGarageKm} KM (₹${totalMonthGarageAmount.toLocaleString('en-IN')})`}>
                    <div className="flex flex-col items-center">
                      <span className="text-blue-200 font-extrabold">{totalMonthGarageKm} KM</span>
                      <span className="text-[9px] text-blue-400 font-normal">₹{totalMonthGarageAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </td>
                )}
                <td colSpan={2} className="py-3 px-2 text-right text-slate-400 font-mono text-[11px]">
                  Total Distance:
                </td>
                <td className="py-3 px-1 text-center font-mono font-black text-emerald-300 text-xs">
                  {totalMonthKm} KM
                </td>
                <td colSpan={2} className="py-3 px-1 text-right text-slate-400 text-[11px]">
                  Total Hours:
                </td>
                <td className="py-3 px-1 text-center font-mono font-bold text-slate-200 text-xs">
                  {totalMonthHours.toFixed(1)}h
                </td>
                {showOvertimeCol && (
                  <td className="py-3 px-1 text-center font-mono font-bold text-amber-300 text-xs">
                    {totalMonthOvertimeHours > 0 ? `${totalMonthOvertimeHours}h` : '-'}
                  </td>
                )}
                <td className="py-3 px-1.5 text-right font-mono font-bold text-amber-300 text-xs">
                  {totalMonthNight > 0 ? `₹${totalMonthNight}` : '-'}
                </td>
                <td className="py-3 px-1.5 text-right font-mono font-bold text-blue-300 text-xs">
                  {totalMonthParking > 0 ? `₹${totalMonthParking}` : '-'}
                </td>
                <td className="py-3 px-1.5 text-right font-mono font-bold text-blue-300 text-xs">
                  {totalMonthToll > 0 ? `₹${totalMonthToll}` : '-'}
                </td>
                <td className="py-3 px-1.5 text-right font-mono font-bold text-purple-300 text-xs">
                  {totalMonthBatta > 0 ? `₹${totalMonthBatta}` : '-'}
                </td>
                {!hideTotalPrice && (
                  <td className="py-3 px-2.5 text-right font-mono font-black text-amber-400 text-sm bg-slate-950">
                    ₹{grandTotalAmount.toLocaleString('en-IN')}
                  </td>
                )}
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Comprehensive Monthly Billing Calculation Break-Up & Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-2xl border border-slate-700 shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-black tracking-wide uppercase text-white">
                Monthly Billing Calculation Break-Up & Summary
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                calcMode === 'both_km_and_overtime'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {calcMode === 'both_km_and_overtime' ? 'Dual Calculation: Both KM & Overtime' : 'Standard Package: Highest Extra'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Separated itemized calculation of total overtime hours with prices + total KM per price + total garage in/out KM + night, parking, toll, and batta surcharges.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleToggleCalcMode()}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                calcMode === 'both_km_and_overtime'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm hover:bg-emerald-700'
                  : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
              }`}
              title="Toggle between Both KM + Overtime Mode and Previous Highest Extra Mode"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dual Calc Mode: {calcMode === 'both_km_and_overtime' ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={() => setHideTotalPrice(!hideTotalPrice)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all ${
                hideTotalPrice
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'
              }`}
              title="Toggle hiding/showing daily row prices while keeping final break-up intact"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Daily Total: {hideTotalPrice ? 'HIDDEN' : 'VISIBLE'}</span>
            </button>
          </div>
        </div>

        {/* 4 Itemized Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total KM Run Charges */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" /> Total KM Run
                </span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono text-emerald-300">
                  {isTieredKmEnabled ? `Slab: ${tier1KmThreshold}k@₹${tier1RatePerKm}` : `@ ₹${ratePerKm}/KM`}
                </span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {totalMonthKm} <span className="text-xs font-normal text-slate-400">KM</span>
              </div>
              {isTieredKmEnabled ? (
                <div className="text-[11px] text-slate-300 font-mono mt-0.5 space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-emerald-400">1st {tieredKmResult.tier1Km} KM × ₹{tier1RatePerKm}:</span>
                    <span className="font-bold">₹{tieredKmResult.tier1Amount.toLocaleString('en-IN')}</span>
                  </div>
                  {tieredKmResult.tier2Km > 0 && (
                    <div className="flex justify-between">
                      <span className="text-amber-400">Excess {tieredKmResult.tier2Km} KM × ₹{tier2RatePerKm}:</span>
                      <span className="font-bold">₹{tieredKmResult.tier2Amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-0.5 font-bold text-white">
                    <span>Total KM Amount:</span>
                    <span className="text-emerald-400">₹{totalMonthKmAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  {totalMonthKm} KM × ₹{ratePerKm} = <span className="font-bold text-emerald-400">₹{totalMonthKmAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleRecalculateKm}
              className="mt-3 w-full py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 flex items-center justify-center gap-1"
            >
              <Calculator className="w-3 h-3 text-emerald-400" />
              <span>Recalc All KM</span>
            </button>
          </div>

          {/* Card 2: Total Overtime Charges */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Total Overtime
                </span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono text-amber-300">
                  @ ₹{overtimeRatePerHour}/hr
                </span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {totalMonthOvertimeHours} <span className="text-xs font-normal text-slate-400">Hrs</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {totalMonthOvertimeHours} hrs × ₹{overtimeRatePerHour} = <span className="font-bold text-amber-400">₹{totalMonthOvertimeAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button
              onClick={handleRecalculateOvertime}
              className="mt-3 w-full py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 flex items-center justify-center gap-1"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Recalc Overtime</span>
            </button>
          </div>

          {/* Card 3: Garage In/Out Distance */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-400" /> Garage In/Out KM
                </span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono text-blue-300">
                  @ ₹{garageRatePerKm}/KM
                </span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-white">
                {totalMonthGarageKm} <span className="text-xs font-normal text-slate-400">KM</span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                {totalMonthGarageKm} KM × ₹{garageRatePerKm} = <span className="font-bold text-blue-400">₹{totalMonthGarageAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <button
              onClick={() => setShowGarageInOut(!showGarageInOut)}
              className="mt-3 w-full py-1 text-[11px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600"
            >
              {showGarageInOut ? 'Garage 2 Cols Active' : 'Enable Garage In/Out'}
            </button>
          </div>

          {/* Card 4: Surcharges & Extras Break-up */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Night / Park / Toll / Batta</span>
                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded font-mono text-purple-300">
                  Extras
                </span>
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-purple-300">
                ₹{(totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta + totalMonthExtraDutyCharges).toLocaleString('en-IN')}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-1 space-y-0.5">
                {totalMonthExtraDutyCharges > 0 && (
                  <div className="flex justify-between"><span className="text-purple-300 font-semibold">Extra Duty Charges:</span> <span className="text-purple-200 font-bold">₹{totalMonthExtraDutyCharges}</span></div>
                )}
                <div className="flex justify-between"><span>Night Charges:</span> <span className="text-white font-bold">₹{totalMonthNight}</span></div>
                <div className="flex justify-between"><span>Parking Charges:</span> <span className="text-white font-bold">₹{totalMonthParking}</span></div>
                <div className="flex justify-between"><span>Toll Charges:</span> <span className="text-white font-bold">₹{totalMonthToll}</span></div>
                <div className="flex justify-between"><span>Driver Batta:</span> <span className="text-white font-bold">₹{totalMonthBatta}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Calculation Formula & Grand Total Summary Bar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
              {calcMode === 'both_km_and_overtime' ? 'Dual Calculation Formula' : 'Package Calculation Formula'}:
            </span>
            <div className="font-mono text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
              {calcMode === 'both_km_and_overtime' ? (
                <>
                  <span className="text-emerald-400 font-bold">{isTieredKmEnabled ? `Slab KM (${tieredKmResult.tier1Km}k@₹${tier1RatePerKm}+${tieredKmResult.tier2Km}k@₹${tier2RatePerKm})` : 'Total KM'}: ₹{totalMonthKmAmount.toLocaleString('en-IN')}</span>
                  <span>+</span>
                  <span className="text-amber-400 font-bold">Overtime: ₹{totalMonthOvertimeAmount.toLocaleString('en-IN')}</span>
                  {totalMonthGarageAmount > 0 && (
                    <>
                      <span>+</span>
                      <span className="text-blue-400 font-bold">Garage: ₹{totalMonthGarageAmount.toLocaleString('en-IN')}</span>
                    </>
                  )}
                  {totalMonthExtraDutyCharges > 0 && (
                    <>
                      <span>+</span>
                      <span className="text-purple-400 font-bold">Extra Duty: ₹{totalMonthExtraDutyCharges.toLocaleString('en-IN')}</span>
                    </>
                  )}
                  <span>+</span>
                  <span className="text-slate-300 font-bold">Surcharges: ₹{(totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta).toLocaleString('en-IN')}</span>
                </>
              ) : (
                <>
                  <span className="text-emerald-400 font-bold">Base + Highest Extra: ₹{(grandTotalAmount - (totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta + totalMonthGarageAmount + totalMonthExtraDutyCharges)).toLocaleString('en-IN')}</span>
                  {totalMonthGarageAmount > 0 && (
                    <>
                      <span>+</span>
                      <span className="text-blue-400 font-bold">Garage: ₹{totalMonthGarageAmount.toLocaleString('en-IN')}</span>
                    </>
                  )}
                  {totalMonthExtraDutyCharges > 0 && (
                    <>
                      <span>+</span>
                      <span className="text-purple-400 font-bold">Extra Duty: ₹{totalMonthExtraDutyCharges.toLocaleString('en-IN')}</span>
                    </>
                  )}
                  <span>+</span>
                  <span className="text-slate-300 font-bold">Surcharges: ₹{(totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta).toLocaleString('en-IN')}</span>
                </>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Grand Total Monthly Net Amount</div>
            <div className="text-3xl font-black font-mono text-emerald-400">
              ₹{grandTotalAmount.toLocaleString('en-IN')}
            </div>
          </div>
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
              Monthly Net Amount: <span className="text-emerald-700 font-extrabold text-base font-mono">₹{grandTotalAmount.toLocaleString('en-IN')}</span>
            </h4>
            <p className="text-xs text-slate-500">
              {calcMode === 'both_km_and_overtime'
                ? `Dual Calculation: Total KM (₹${totalMonthKmAmount}) + Overtime (₹${totalMonthOvertimeAmount}) + Garage (₹${totalMonthGarageAmount}) + Extra Duty (₹${totalMonthExtraDutyCharges}) + Surcharges (₹${totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta}).`
                : `Base Package (${defaultBaseKm} KM & ${defaultDutyHours}h) + Highest of Extra KM vs Extra Hours + Extra Duty (₹${totalMonthExtraDutyCharges}) + Surcharges (₹${totalMonthNight + totalMonthParking + totalMonthToll + totalMonthBatta}).`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Preview & Download PDF</span>
          </button>

          <button
            onClick={handleSaveAllSlips}
            disabled={isAutoSaving}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-colors border border-slate-700"
            title="Immediately synchronize all 31 days of duty slips to database"
          >
            <Database className={`w-4 h-4 ${isAutoSaving ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
            <span>{isAutoSaving ? 'Syncing to DB...' : 'Save to Database Now'}</span>
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

      {/* Preview & Download Modal for 100% Reliable PDF Download */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Monthly Vehicle Bill Preview - ${selectedVeh?.regNumber} (${selectedMonthName})`}
        subtitle="Customizable multi-format PDF with itemized calculation break-up and dynamic columns"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Top Actions & Multi-Format Bar inside modal */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-3 no-print">
            {/* Multi-Format PDF Selection */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>PDF Format:</span>
              </span>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'bishal-official', label: 'Official JULU BISHAL (Previous Format)' },
                  { id: 'dual-km-overtime', label: 'Dual KM + OT Break-Up (New Structure)' },
                  { id: 'corporate-duty-annexure', label: 'Corporate Annexure' },
                  { id: 'executive-summary', label: 'Executive Summary' },
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setPdfFormat(fmt.id as any);
                      if (fmt.id === 'bishal-official') {
                        setShowOvertimeCol(false);
                        setShowGarageColsInPdf(false);
                        setShowExtraDutyCol(false);
                      } else if (fmt.id === 'dual-km-overtime') {
                        setShowOvertimeCol(true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      pdfFormat === fmt.id
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Toggles inside Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Toggles:</span>

                {/* Toggle Start/End KM */}
                <button
                  type="button"
                  onClick={() => setShowStartEndKmInPdf(!showStartEndKmInPdf)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showStartEndKmInPdf
                      ? 'bg-emerald-800/80 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Start/End KM: {showStartEndKmInPdf ? 'ON' : 'OFF'}
                </button>

                {/* Toggle Start/End Time */}
                <button
                  type="button"
                  onClick={() => setShowStartEndTimeInPdf(!showStartEndTimeInPdf)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showStartEndTimeInPdf
                      ? 'bg-emerald-800/80 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Start/End Time: {showStartEndTimeInPdf ? 'ON' : 'OFF'}
                </button>

                {/* Toggle Garage In/Out Calculation */}
                <button
                  type="button"
                  onClick={() => handleToggleGarageInOut()}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showGarageInOut
                      ? 'bg-blue-800/80 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="Include Garage In/Out distance calculation below in PDF report"
                >
                  Garage Calc: {showGarageInOut ? 'ON (Calc Below)' : 'OFF'}
                </button>

                {/* Toggle Garage Columns in PDF (Default: OFF - only columns are not shown in PDF) */}
                <button
                  type="button"
                  onClick={() => setShowGarageColsInPdf(!showGarageColsInPdf)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showGarageColsInPdf
                      ? 'bg-blue-800/80 border-blue-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="Show or hide Garage Out / In table columns in the PDF report (Default: Hidden)"
                >
                  Garage Cols in PDF: {showGarageColsInPdf ? 'ON' : 'OFF'}
                </button>

                {/* Toggle Overtime Col */}
                <button
                  type="button"
                  onClick={() => setShowOvertimeCol(!showOvertimeCol)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showOvertimeCol
                      ? 'bg-amber-800/80 border-amber-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  OT Col: {showOvertimeCol ? 'ON' : 'OFF'}
                </button>

                {/* Toggle Extra Duty Charges Col */}
                <button
                  type="button"
                  onClick={() => setShowExtraDutyCol(!showExtraDutyCol)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    showExtraDutyCol
                      ? 'bg-purple-800/80 border-purple-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Extra Duty (₹): {showExtraDutyCol ? 'ON' : 'OFF'}
                </button>

                {/* Toggle Daily Total Price */}
                <button
                  type="button"
                  onClick={() => setHideTotalPrice(!hideTotalPrice)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                    hideTotalPrice
                      ? 'bg-rose-800/80 border-rose-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  Daily Price: {hideTotalPrice ? 'HIDDEN' : 'VISIBLE'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Print Date in Modal Header */}
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400 text-[11px] font-bold">Print Date:</span>
                  <input
                    type="date"
                    value={printDate}
                    onChange={e => setPrintDate(e.target.value)}
                    className="bg-transparent text-amber-300 font-mono font-bold text-xs outline-none cursor-pointer"
                    title="Change print/invoice date stamped in the PDF header and banking section"
                  />
                </div>

                <button
                  onClick={triggerPrint}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-400" />
                  <span>Print</span>
                </button>

                <button
                  onClick={async () => {
                    setIsDownloadingPdf(true);
                    const filename = `${company.businessName || 'BISHAL_TRAVELS'}_${selectedVeh?.regNumber || 'Vehicle'}_${selectedMonthName.replace(/\s+/g, '_')}`;
                    await downloadInvoiceAsPdf('bishal-sheet-preview-render-modal', filename);
                    setIsDownloadingPdf(false);
                  }}
                  disabled={isDownloadingPdf}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Slab KM Billing Controls in PDF Modal */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-inner">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => applyTieredSlabCalculation(!isTieredKmEnabled, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border flex items-center gap-1.5 ${
                    isTieredKmEnabled
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow-md ring-2 ring-cyan-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:border-slate-600'
                  }`}
                  title="Toggle Tiered Slab KM billing in PDF"
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Slab KM Billing: {isTieredKmEnabled ? 'ACTIVE' : 'OFF'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-bold">1st Slab KM:</span>
                  <input
                    type="number"
                    value={tier1KmThreshold}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setTier1KmThreshold(val);
                      if (isTieredKmEnabled) {
                        applyTieredSlabCalculation(true, val, tier1RatePerKm, tier2RatePerKm);
                      }
                    }}
                    className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono font-bold text-center text-xs"
                    placeholder="2000"
                  />
                  <span className="text-slate-400 text-[10px]">KM</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-bold">Slab 1:</span>
                  <span className="text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={tier1RatePerKm}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setTier1RatePerKm(val);
                      if (isTieredKmEnabled) {
                        applyTieredSlabCalculation(true, tier1KmThreshold, val, tier2RatePerKm);
                      }
                    }}
                    className="w-16 px-1.5 py-1 bg-slate-800 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono font-bold text-center text-xs"
                    placeholder="19"
                  />
                  <span className="text-slate-400 text-[10px]">/KM</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px] font-bold">Excess:</span>
                  <span className="text-slate-400 text-xs">₹</span>
                  <input
                    type="number"
                    value={tier2RatePerKm}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setTier2RatePerKm(val);
                      if (isTieredKmEnabled) {
                        applyTieredSlabCalculation(true, tier1KmThreshold, tier1RatePerKm, val);
                      }
                    }}
                    className="w-16 px-1.5 py-1 bg-slate-800 border border-amber-500/60 rounded-lg text-amber-300 font-mono font-bold text-center text-xs"
                    placeholder="12"
                  />
                  <span className="text-slate-400 text-[10px]">/KM</span>
                </div>

                {/* 1-Click Dynamic Apply & Recalculate Button */}
                <button
                  type="button"
                  onClick={() => applyTieredSlabCalculation(true, tier1KmThreshold, tier1RatePerKm, tier2RatePerKm)}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all shadow border border-cyan-400"
                  title="Recalculate PDF and all rows with this dynamic slab configuration"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>⚡ Apply Slab & Recalculate PDF</span>
                </button>
              </div>

              {/* Real-time Slab Calculation Summary Chip */}
              <div className="text-[11px] font-mono bg-slate-800/90 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 text-slate-300">
                <span className="text-slate-400">{totalMonthKm} KM Run:</span>
                <span className="text-cyan-400 font-bold">
                  {Math.min(totalMonthKm, tier1KmThreshold)} KM × ₹{tier1RatePerKm}
                </span>
                {totalMonthKm > tier1KmThreshold && (
                  <>
                    <span className="text-slate-500">+</span>
                    <span className="text-amber-400 font-bold">
                      {Math.max(0, totalMonthKm - tier1KmThreshold)} KM × ₹{tier2RatePerKm}
                    </span>
                  </>
                )}
                <span className="text-slate-500">=</span>
                <span className="text-white font-black bg-cyan-950/90 px-2 py-0.5 rounded border border-cyan-500">
                  ₹{(isTieredKmEnabled ? totalMonthKmAmount : (totalMonthKm * ratePerKm)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Render Container for high-quality capture */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-100 p-4 md:p-6 shadow-inner flex justify-center">
            {selectedVeh && (
              <BishalMonthlyInvoicePdfTemplate
                company={company}
                vehicle={selectedVeh}
                monthTitle={selectedMonthName}
                invoiceDateStr={formatDate(printDate || new Date(), 'dd-MM-yyyy')}
                rows={rows.map(r => ({
                  date: formatDate(r.dateStr, 'dd-MM-yyyy'),
                  dutySlipNo: r.dutySlipNo,
                  startTime: r.startTime || '',
                  endTime: r.endTime || '',
                  hours: r.totalHours > 0 ? r.totalHours : '',
                  extraHours: r.extraHours > 0 ? r.extraHours : '',
                  extraDuty: r.extraDuty || '',
                  extraDutyCharges: Number(r.extraDutyCharges) || 0,
                  startKm: r.startKm > 0 ? r.startKm : '',
                  endKm: r.endKm > 0 ? r.endKm : '',
                  km: r.totalKm > 0 ? r.totalKm : '',
                  garageOutKm: r.garageOutKm || '',
                  garageInKm: r.garageInKm || '',
                  garageKm: r.garageKm || '',
                  overtimeCharges: Number(r.overtimeCharges) || 0,
                  nightCharge: Number(r.nightCharges) || 0,
                  parkingCharge: Number(r.parkingCharges) || 0,
                  tollCharge: Number(r.tollCharges) || 0,
                  driverBatta: Number(r.driverBatta) || 0,
                  totalAmount: Number(r.dayTotalAmount) || 0,
                  isOff: r.isOffDay || r.totalKm === 0,
                }))}
                totalHours={Math.round(totalMonthHours)}
                totalKm={totalMonthKm}
                totalOvertimeHours={totalMonthOvertimeHours}
                totalGarageKm={totalMonthGarageKm}
                totalExtraDutyCharges={totalMonthExtraDutyCharges}
                totalNight={totalMonthNight}
                totalParking={totalMonthParking}
                totalToll={totalMonthToll}
                totalBatta={totalMonthBatta}
                grandTotalAmount={grandTotalAmount}
                client={selectedCli}
                elementId="bishal-sheet-preview-render-modal"
                hideOffDays={true}
                showStartEndKm={showStartEndKmInPdf}
                showStartEndTime={showStartEndTimeInPdf}
                showGarageInOut={showGarageInOut}
                showGarageCols={showGarageColsInPdf}
                showOvertimeCol={showOvertimeCol}
                showExtraDutyCol={showExtraDutyCol}
                hideTotalPrice={hideTotalPrice}
                calcMode={calcMode}
                pdfFormat={pdfFormat}
                ratePerKm={ratePerKm}
                overtimeRatePerHour={overtimeRatePerHour}
                garageRatePerKm={garageRatePerKm}
                tieredKmConfig={{
                  enabled: isTieredKmEnabled,
                  baseKmThreshold: tier1KmThreshold,
                  tier1Rate: tier1RatePerKm,
                  tier2Rate: tier2RatePerKm,
                }}
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

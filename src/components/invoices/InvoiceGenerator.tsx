import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Car, 
  Calendar, 
  Building, 
  Calculator, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Download, 
  Eye, 
  Sparkles,
  CreditCard,
  Percent,
  Receipt
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { 
  Invoice, 
  InvoiceItem, 
  TaxType, 
  InvoiceStatus,
  Client,
  Vehicle,
  DutySlip
} from '../../types';
import { 
  calculateInvoiceTotals, 
  generateNextInvoiceNumber, 
  calculateInvoiceItemAmount 
} from '../../utils/calculations';
import { formatCurrency, numberToWordsIndian, formatDate } from '../../utils/formatters';

export const InvoiceGenerator: React.FC = () => {
  const { 
    company, 
    clients, 
    vehicles, 
    dutySlips, 
    invoices, 
    createInvoice, 
    setActiveTab, 
    setSelectedInvoiceForView 
  } = useApp();

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || '');
  
  // Billing cycle
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const [billingMonth, setBillingMonth] = useState<string>(currentMonthName);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + (clients[0]?.paymentTermsDays || 15));
  const [dueDate, setDueDate] = useState<string>(defaultDueDate.toISOString().slice(0, 10));

  const [invoiceNumber, setInvoiceNumber] = useState<string>(() => 
    generateNextInvoiceNumber(invoices.length, 'BT')
  );
  const [contractRefNo, setContractRefNo] = useState<string>(clients[0]?.contractRefNo || '');

  // Billing Model: 'package' (Monthly Base + Overtime/Night/Parking) or 'aggregated_slips' (Duty Slips) or 'per_km'
  const [billingModel, setBillingModel] = useState<'package' | 'aggregated_slips' | 'custom'>('package');

  // Items
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Taxes & Deductions
  const [taxType, setTaxType] = useState<TaxType>('GST_5');
  const [isInterstate, setIsInterstate] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [advanceReceived, setAdvanceReceived] = useState<number>(0);
  const [tdsRate, setTdsRate] = useState<number>(0); // e.g. 0, 1, 2%
  const [notes, setNotes] = useState<string>('Thank you for choosing BISHAL TRAVELS. Please release payment as per the bank details mentioned below.');
  const [attachedDutySlipIds, setAttachedDutySlipIds] = useState<string[]>([]);

  // Update client defaults when selected client changes
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setContractRefNo(client.contractRefNo || '');
      const d = new Date(invoiceDate);
      d.setDate(d.getDate() + (client.paymentTermsDays || 15));
      setDueDate(d.toISOString().slice(0, 10));
    }
  };

  // Initial Item Population
  const buildInitialPackageItem = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
    if (!vehicle) return;

    // Search relevant duty slips for this vehicle and client
    const unbilledSlips = dutySlips.filter(
      ds => ds.vehicleId === vehicle.id && (ds.clientId === selectedClientId || !ds.clientId) && ds.status === 'Pending'
    );

    const totalSlipKm = unbilledSlips.reduce((sum, s) => sum + s.totalKm, 0);
    const totalSlipNight = unbilledSlips.reduce((sum, s) => sum + s.nightCharges, 0);
    const totalSlipParking = unbilledSlips.reduce((sum, s) => sum + s.parkingCharges, 0);
    const totalSlipToll = unbilledSlips.reduce((sum, s) => sum + s.tollCharges, 0);
    const totalSlipBatta = unbilledSlips.reduce((sum, s) => sum + s.driverBatta, 0);

    const basePackageKm = 2500;
    const extraKm = Math.max(0, totalSlipKm - basePackageKm);
    const extraKmCharges = extraKm * vehicle.ratePerKm;

    const initialItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: `Monthly Vehicle Rental - ${vehicle.model} (${vehicle.regNumber}) [${billingMonth}]`,
      vehicleRegNo: vehicle.regNumber,
      vehicleModel: vehicle.model,
      billingType: 'MonthlyPackage',
      basePackageAmount: vehicle.baseMonthlyRate || 38000,
      totalRunKm: totalSlipKm > 0 ? totalSlipKm : 2500,
      ratePerKm: vehicle.ratePerKm,
      kmCharges: 0,
      extraKm: extraKm,
      extraKmRate: vehicle.ratePerKm,
      extraKmCharges: extraKmCharges,
      extraHours: 0,
      extraHourRate: vehicle.ratePerHour,
      extraHourCharges: 0,
      nightCharges: totalSlipNight > 0 ? totalSlipNight : 0,
      parkingCharges: totalSlipParking > 0 ? totalSlipParking : 0,
      tollCharges: totalSlipToll > 0 ? totalSlipToll : 0,
      driverAllowance: totalSlipBatta > 0 ? totalSlipBatta : 0,
      otherCharges: 0,
      amount: 0
    };

    initialItem.amount = calculateInvoiceItemAmount(initialItem);
    setItems([initialItem]);
    setAttachedDutySlipIds(unbilledSlips.map(s => s.id));
  };

  useEffect(() => {
    if (items.length === 0 && vehicles.length > 0) {
      buildInitialPackageItem();
    }
  }, [selectedVehicleId, selectedClientId, billingMonth]);

  // Aggregate Duty Slips Mode
  const handleAggregateFromDutySlips = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle) return;

    const matchingSlips = dutySlips.filter(
      ds => ds.vehicleId === vehicle.id && (ds.clientId === selectedClientId || !ds.clientId) && ds.status === 'Pending'
    );

    if (matchingSlips.length === 0) {
      alert(`No pending unbilled duty slips found for ${vehicle.regNumber}. You can enter values manually or record daily slips first.`);
      return;
    }

    const totalKm = matchingSlips.reduce((sum, s) => sum + s.totalKm, 0);
    const totalNight = matchingSlips.reduce((sum, s) => sum + s.nightCharges, 0);
    const totalParking = matchingSlips.reduce((sum, s) => sum + s.parkingCharges, 0);
    const totalToll = matchingSlips.reduce((sum, s) => sum + s.tollCharges, 0);
    const totalBatta = matchingSlips.reduce((sum, s) => sum + s.driverBatta, 0);
    const kmCharges = totalKm * vehicle.ratePerKm;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: `Trip Run Billing - ${vehicle.model} (${vehicle.regNumber}) [${matchingSlips.length} Trips, ${totalKm} KM @ ₹${vehicle.ratePerKm}/KM]`,
      vehicleRegNo: vehicle.regNumber,
      vehicleModel: vehicle.model,
      billingType: 'DutySlipAggregated',
      basePackageAmount: 0,
      totalRunKm: totalKm,
      ratePerKm: vehicle.ratePerKm,
      kmCharges: kmCharges,
      extraKm: 0,
      extraKmRate: 0,
      extraKmCharges: 0,
      extraHours: 0,
      extraHourRate: 0,
      extraHourCharges: 0,
      nightCharges: totalNight,
      parkingCharges: totalParking,
      tollCharges: totalToll,
      driverAllowance: totalBatta,
      otherCharges: 0,
      amount: kmCharges + totalNight + totalParking + totalToll + totalBatta
    };

    setItems(prev => [...prev, newItem]);
    setAttachedDutySlipIds(prev => [...prev, ...matchingSlips.map(s => s.id)]);
  };

  // 30 Days Full Run Non-GST Preset
  const handleApply30DaysNonGstBilling = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
    if (!vehicle) return;

    // Pull all slips for this vehicle
    const matchingSlips = dutySlips.filter(
      ds => ds.vehicleId === vehicle.id && (ds.clientId === selectedClientId || !ds.clientId)
    );

    const totalKm = matchingSlips.length > 0 
      ? matchingSlips.reduce((sum, s) => sum + s.totalKm, 0) 
      : 2400; // default 30 days * 80 KM/day
    
    const totalNight = matchingSlips.reduce((sum, s) => sum + s.nightCharges, 0);
    const totalParking = matchingSlips.reduce((sum, s) => sum + s.parkingCharges, 0);
    const totalToll = matchingSlips.reduce((sum, s) => sum + s.tollCharges, 0);
    const totalBatta = matchingSlips.reduce((sum, s) => sum + s.driverBatta, 0);

    const baseMonthlyAmt = vehicle.baseMonthlyRate || 38000;
    const extraKmCharges = totalKm > 2500 ? (totalKm - 2500) * vehicle.ratePerKm : 0;

    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: `30 Days Monthly Vehicle Duty - ${vehicle.model} (${vehicle.regNumber}) [${matchingSlips.length > 0 ? matchingSlips.length : 30} Days, ${totalKm} KM Run]`,
      vehicleRegNo: vehicle.regNumber,
      vehicleModel: vehicle.model,
      billingType: 'MonthlyPackage',
      basePackageAmount: baseMonthlyAmt,
      totalRunKm: totalKm,
      ratePerKm: vehicle.ratePerKm,
      kmCharges: 0,
      extraKm: Math.max(0, totalKm - 2500),
      extraKmRate: vehicle.ratePerKm,
      extraKmCharges: extraKmCharges,
      extraHours: 0,
      extraHourRate: vehicle.ratePerHour,
      extraHourCharges: 0,
      nightCharges: totalNight,
      parkingCharges: totalParking,
      tollCharges: totalToll,
      driverAllowance: totalBatta,
      otherCharges: 0,
      amount: baseMonthlyAmt + extraKmCharges + totalNight + totalParking + totalToll + totalBatta
    };

    setTaxType('NON_GST'); // Non-GST by default!
    setItems([newItem]);
    if (matchingSlips.length > 0) {
      setAttachedDutySlipIds(matchingSlips.map(s => s.id));
    }
  };

  const handleAddItem = () => {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: `Additional Vehicle Duty / Outstation Charges`,
      vehicleRegNo: vehicle?.regNumber,
      vehicleModel: vehicle?.model,
      billingType: 'Custom',
      basePackageAmount: 0,
      totalRunKm: 0,
      ratePerKm: 0,
      kmCharges: 0,
      extraKm: 0,
      extraKmRate: 0,
      extraKmCharges: 0,
      extraHours: 0,
      extraHourRate: 0,
      extraHourCharges: 0,
      nightCharges: 0,
      parkingCharges: 0,
      tollCharges: 0,
      driverAllowance: 0,
      otherCharges: 0,
      amount: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<InvoiceItem>) => {
    setItems(prev => {
      const copy = [...prev];
      const updated = { ...copy[index], ...updates };
      updated.amount = calculateInvoiceItemAmount(updated);
      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Compute Invoice Totals
  const totals = calculateInvoiceTotals({
    items,
    taxType,
    isInterstate,
    discount,
    advanceReceived,
    tdsRate,
  });

  const amountInWords = numberToWordsIndian(totals.netPayable);

  const handleCreateInvoice = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) {
      alert('Please select a client.');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one line item.');
      return;
    }

    const newInvoice: Omit<Invoice, 'id' | 'createdAt'> = {
      invoiceNumber,
      invoiceDate,
      dueDate,
      billingMonth,
      clientId: client.id,
      clientSnapshot: client,
      contractRefNo: contractRefNo || client.contractRefNo || '',
      items,
      attachedDutySlipIds,
      subtotal: totals.subtotal,
      taxType,
      taxRate: totals.taxRate,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      isInterstate,
      discount: totals.discountAmount,
      advanceReceived,
      tdsRate,
      tdsAmount: totals.tdsAmount,
      grandTotal: totals.grandTotal,
      netPayable: totals.netPayable,
      amountInWords,
      bankDetails: {
        bankName: company.bankName,
        accountHolder: company.accountHolder,
        accountNumber: company.accountNumber,
        ifscCode: company.ifscCode,
        branchName: company.branchName,
        upiId: company.upiId,
      },
      tradeLicenseNo: company.tradeLicenseNo,
      companyGstin: company.gstin,
      companyPan: company.pan,
      companyPhone: company.phone,
      companyEmail: company.email,
      companyAddress: company.address,
      status: 'Sent',
      notes,
      terms: company.defaultTerms,
    };

    const created = createInvoice(newInvoice);
    setSelectedInvoiceForView(created);
    setActiveTab('invoices');
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Calculator className="w-6 h-6 text-emerald-600" />
            <span>Generate Monthly Travel Invoice</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Calculate vehicle run, night halt, parking charges, apply GST, and produce print-ready invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('invoices')}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            View All Invoices
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Configuration & Line Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: Client, Vehicle & Dates */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building className="w-4 h-4 text-emerald-600" />
              1. Client & Invoice Particulars
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Client <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={e => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName || c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contract / Agreement Ref
                </label>
                <input
                  type="text"
                  value={contractRefNo}
                  onChange={e => setContractRefNo(e.target.value)}
                  placeholder="e.g. EIPL/TRAN/2026-27/044"
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Number
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={e => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Billing Period / Month <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={billingMonth}
                  onChange={e => setBillingMonth(e.target.value)}
                  placeholder="e.g. August 2026"
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Invoice Date
                </label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {selectedClient && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <span><strong>Bill To:</strong> {selectedClient.companyName}</span>
                {selectedClient.gstin && <span><strong>GSTIN:</strong> {selectedClient.gstin}</span>}
                <span><strong>Phone:</strong> {selectedClient.phone}</span>
              </div>
            )}
          </div>

          {/* STEP 2: Vehicle & Quick Population Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                2. Vehicle & Rate Package
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApply30DaysNonGstBilling}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all hover:scale-105"
                  title="Quick-generate invoice for 30 days of vehicle duty without GST"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                  <span>⚡ 30 Days Full Run (Non-GST)</span>
                </button>

                <button
                  type="button"
                  onClick={handleAggregateFromDutySlips}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pull Duty Slips</span>
                </button>

                <button
                  type="button"
                  onClick={buildInitialPackageItem}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors"
                >
                  Monthly Package
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Vehicle For Package
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={e => setSelectedVehicleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.regNumber} - {v.model} (Base: ₹{v.baseMonthlyRate}, KM: ₹{v.ratePerKm})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* STEP 3: Line Items Editor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                3. Invoice Line Items & Detailed Calculations
              </h3>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div 
                  key={item.id} 
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-800">
                      Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Description / Package Title
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => handleUpdateItem(idx, { description: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      placeholder="e.g. Monthly Dedicated Vehicle Rental - Swift Dzire (WB 02 AL 4589)"
                    />
                  </div>

                  {/* Pricing Inputs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Base Monthly Package (₹)
                      </label>
                      <input
                        type="number"
                        value={item.basePackageAmount}
                        onChange={e => handleUpdateItem(idx, { basePackageAmount: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Total Run (KM)
                      </label>
                      <input
                        type="number"
                        value={item.totalRunKm}
                        onChange={e => handleUpdateItem(idx, { totalRunKm: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Extra KM × Rate
                      </label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          placeholder="KM"
                          value={item.extraKm}
                          onChange={e => handleUpdateItem(idx, { extraKm: Number(e.target.value) })}
                          className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg font-mono bg-white text-center"
                        />
                        <input
                          type="number"
                          placeholder="₹/KM"
                          value={item.extraKmRate}
                          onChange={e => handleUpdateItem(idx, { extraKmRate: Number(e.target.value) })}
                          className="w-1/2 px-2 py-1.5 border border-slate-300 rounded-lg font-mono bg-white text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Night Charges (₹)
                      </label>
                      <input
                        type="number"
                        value={item.nightCharges}
                        onChange={e => handleUpdateItem(idx, { nightCharges: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold bg-white text-amber-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Parking Charges (₹)
                      </label>
                      <input
                        type="number"
                        value={item.parkingCharges}
                        onChange={e => handleUpdateItem(idx, { parkingCharges: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold bg-white text-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Toll Tax Charges (₹)
                      </label>
                      <input
                        type="number"
                        value={item.tollCharges}
                        onChange={e => handleUpdateItem(idx, { tollCharges: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold bg-white text-blue-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Driver Allowance (₹)
                      </label>
                      <input
                        type="number"
                        value={item.driverAllowance}
                        onChange={e => handleUpdateItem(idx, { driverAllowance: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold bg-white text-purple-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                        Row Total Amount
                      </label>
                      <div className="px-2.5 py-1.5 bg-emerald-100/70 border border-emerald-200 rounded-lg font-mono font-bold text-emerald-950 text-right">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Summary, Taxes, Deductions & Bank Auto-Populate */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              Tax, Deductions & Net Calculation
            </h3>

            <div className="space-y-3 text-xs">
              {/* Tax Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 flex items-center justify-between">
                  <span>Tax & GST Setting</span>
                  {taxType === 'NON_GST' && (
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                      Non-GST Invoice
                    </span>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setTaxType('NON_GST')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                      taxType === 'NON_GST'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Non-GST (0%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxType('GST_5')}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold border transition-all ${
                      taxType === 'GST_5'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    GST 5% (Standard)
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxType('GST_12')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                      taxType === 'GST_12'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    GST 12%
                  </button>

                  <button
                    type="button"
                    onClick={() => setTaxType('GST_18')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                      taxType === 'GST_18'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    GST 18%
                  </button>
                </div>

                {taxType !== 'NON_GST' && (
                  <label className="flex items-center gap-2 p-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 cursor-pointer bg-slate-50">
                    <input
                      type="checkbox"
                      checked={isInterstate}
                      onChange={e => setIsInterstate(e.target.checked)}
                      className="text-emerald-600 rounded"
                    />
                    <span>Interstate Billing (IGST)</span>
                  </label>
                )}
              </div>

              {/* Deductions & Advance */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={advanceReceived}
                    onChange={e => setAdvanceReceived(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-0.5">
                    TDS Rate (%)
                  </label>
                  <input
                    type="number"
                    value={tdsRate}
                    onChange={e => setTdsRate(Number(e.target.value))}
                    placeholder="e.g. 2%"
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Financial Breakdown Summary Table */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 font-medium">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Amount:</span>
                  <span className="font-mono text-slate-900">{formatCurrency(totals.subtotal)}</span>
                </div>

                {totals.taxRate > 0 && !isInterstate && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST ({totals.taxRate / 2}%):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(totals.cgst)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST ({totals.taxRate / 2}%):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(totals.sgst)}</span>
                    </div>
                  </>
                )}

                {totals.taxRate > 0 && isInterstate && (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST ({totals.taxRate}%):</span>
                    <span className="font-mono text-slate-900">{formatCurrency(totals.igst)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-slate-900">{formatCurrency(totals.grandTotal)}</span>
                </div>

                {totals.tdsAmount > 0 && (
                  <div className="flex justify-between text-rose-600 text-[11px]">
                    <span>Less TDS ({tdsRate}%):</span>
                    <span className="font-mono">-{formatCurrency(totals.tdsAmount)}</span>
                  </div>
                )}

                {advanceReceived > 0 && (
                  <div className="flex justify-between text-emerald-700 text-[11px]">
                    <span>Less Advance Received:</span>
                    <span className="font-mono">-{formatCurrency(advanceReceived)}</span>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-slate-300 flex justify-between items-center text-sm font-extrabold text-emerald-950 bg-emerald-100/60 p-2 rounded-lg -mx-1">
                  <span>Net Payable:</span>
                  <span className="text-base font-mono font-black text-emerald-900">
                    {formatCurrency(totals.netPayable)}
                  </span>
                </div>
              </div>

              {/* Amount In Words Display */}
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200/70 text-[11px] text-emerald-900 font-medium">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-700">Amount in Words:</span>
                {amountInWords}
              </div>

              {/* Auto-Populated Bank Preview Card */}
              <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Auto-Populated Bank Box
                </div>
                <div className="text-[11px] text-slate-300">
                  <div><strong>Bank:</strong> {company.bankName}</div>
                  <div><strong>A/C No:</strong> {company.accountNumber}</div>
                  <div><strong>IFSC:</strong> {company.ifscCode}</div>
                  <div><strong>Trade License:</strong> {company.tradeLicenseNo}</div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCreateInvoice}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Create & View Official Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

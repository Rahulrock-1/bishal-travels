import React from 'react';
import { Invoice, CompanyProfile } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface InvoicePrintTemplateProps {
  invoice: Invoice;
  company: CompanyProfile;
}

export const InvoicePrintTemplate: React.FC<InvoicePrintTemplateProps> = ({
  invoice,
  company,
}) => {
  return (
    <div 
      id={`invoice-print-doc-${invoice.id}`}
      className="bg-white text-slate-900 p-8 md:p-10 font-sans max-w-[800px] mx-auto border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0"
      style={{ minHeight: '1050px' }}
    >
      {/* Top Legal Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-950 uppercase font-sans">
              {company.businessName || 'BISHAL TRAVELS'}
            </h1>
          </div>
          <p className="text-xs font-semibold text-emerald-800 tracking-wide uppercase mt-0.5">
            {company.tagline || 'Car Rental & Fleet Logistics Services'}
          </p>
          
          <div className="mt-2 text-[11px] text-slate-600 space-y-0.5 max-w-[420px] leading-relaxed">
            <p>{company.address}</p>
            <p><strong>Phone:</strong> {company.phone} | <strong>Email:</strong> {company.email}</p>
          </div>

          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-mono font-bold rounded border border-slate-300">
              Trade License: {invoice.tradeLicenseNo || company.tradeLicenseNo}
            </span>
            {invoice.companyGstin && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-mono font-bold rounded border border-slate-300">
                GSTIN: {invoice.companyGstin}
              </span>
            )}
            {invoice.companyPan && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-900 font-mono font-bold rounded border border-slate-300">
                PAN: {invoice.companyPan}
              </span>
            )}
          </div>
        </div>

        {/* Invoice Title & Metadata */}
        <div className="text-right">
          <div className="inline-block bg-slate-900 text-white px-3.5 py-1 text-xs font-extrabold tracking-wider uppercase rounded">
            {invoice.taxType === 'NON_GST' || invoice.taxRate === 0 ? 'MONTHLY BILL / COMMERCIAL INVOICE' : 'TAX INVOICE'}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">
            {invoice.taxType === 'NON_GST' || invoice.taxRate === 0 ? 'Non-GST Billing' : 'Original for Recipient'}
          </div>

          <div className="mt-3 text-xs space-y-1">
            <div>
              <span className="text-slate-500 font-semibold">Invoice No: </span>
              <strong className="font-mono text-slate-900 text-sm">{invoice.invoiceNumber}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Date: </span>
              <strong className="font-medium text-slate-900">{formatDate(invoice.invoiceDate)}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Billing Month: </span>
              <strong className="font-bold text-emerald-800">{invoice.billingMonth}</strong>
            </div>
            <div>
              <span className="text-slate-500 font-semibold">Payment Due: </span>
              <strong className="font-medium text-slate-900">{formatDate(invoice.dueDate)}</strong>
            </div>
            {invoice.contractRefNo && (
              <div className="pt-1">
                <span className="text-slate-500 font-semibold text-[11px]">Contract Ref: </span>
                <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  {invoice.contractRefNo}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill To / Client Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
            BILLED TO / CLIENT:
          </span>
          <h3 className="text-sm font-black text-slate-950">
            {invoice.clientSnapshot?.companyName || invoice.clientSnapshot?.name}
          </h3>
          {invoice.clientSnapshot?.name && (
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Attn: {invoice.clientSnapshot.name}
            </p>
          )}
          <p className="text-slate-600 mt-1 leading-relaxed">
            {invoice.clientSnapshot?.address}
          </p>
        </div>

        <div className="md:text-right space-y-1">
          {invoice.clientSnapshot?.gstin && (
            <div>
              <span className="text-slate-500 font-medium">Client GSTIN: </span>
              <strong className="font-mono text-slate-900">{invoice.clientSnapshot.gstin}</strong>
            </div>
          )}
          {invoice.clientSnapshot?.pan && (
            <div>
              <span className="text-slate-500 font-medium">Client PAN: </span>
              <strong className="font-mono text-slate-900">{invoice.clientSnapshot.pan}</strong>
            </div>
          )}
          <div>
            <span className="text-slate-500 font-medium">Phone: </span>
            <span className="text-slate-800">{invoice.clientSnapshot?.phone}</span>
          </div>
          {invoice.clientSnapshot?.email && (
            <div>
              <span className="text-slate-500 font-medium">Email: </span>
              <span className="text-slate-800">{invoice.clientSnapshot.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Table */}
      <div className="mb-6 overflow-hidden rounded-lg border border-slate-300">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider">
              <th className="py-2.5 px-3 w-8 text-center border-r border-slate-700">#</th>
              <th className="py-2.5 px-3 border-r border-slate-700">Description of Service & Vehicle</th>
              <th className="py-2.5 px-2.5 text-center border-r border-slate-700">Run (KM)</th>
              <th className="py-2.5 px-2.5 text-right border-r border-slate-700">Base / Extra</th>
              <th className="py-2.5 px-2.5 text-right border-r border-slate-700">Night / Park / Toll</th>
              <th className="py-2.5 px-3 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
            {invoice.items.map((item, index) => {
              const extraCharges = (item.extraKmCharges || 0) + (item.extraHourCharges || 0);
              const otherTripCharges = (item.nightCharges || 0) + (item.parkingCharges || 0) + (item.tollCharges || 0) + (item.driverAllowance || 0);

              return (
                <tr key={item.id || index} className="align-top">
                  <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-200">
                    {index + 1}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-200">
                    <div className="font-bold text-slate-900">{item.description}</div>
                    {item.vehicleRegNo && (
                      <div className="text-[11px] font-mono text-emerald-800 font-semibold mt-0.5">
                        Vehicle No: {item.vehicleRegNo}
                      </div>
                    )}
                    {item.extraKm > 0 && (
                      <div className="text-[10px] text-slate-500">
                        Extra Run: {item.extraKm} KM @ ₹{item.extraKmRate}/KM
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2.5 text-center font-mono font-bold border-r border-slate-200">
                    {item.totalRunKm ? `${item.totalRunKm} KM` : '-'}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200 text-[11px]">
                    {item.basePackageAmount > 0 && (
                      <div>Base: ₹{item.basePackageAmount.toLocaleString('en-IN')}</div>
                    )}
                    {extraCharges > 0 && (
                      <div className="text-slate-600">+Extra: ₹{extraCharges.toLocaleString('en-IN')}</div>
                    )}
                    {item.basePackageAmount === 0 && extraCharges === 0 && item.kmCharges > 0 && (
                      <div>₹{item.kmCharges.toLocaleString('en-IN')}</div>
                    )}
                  </td>
                  <td className="py-3 px-2.5 text-right font-mono border-r border-slate-200 text-[11px] space-y-0.5">
                    {item.nightCharges > 0 && <div className="text-amber-800">Night: ₹{item.nightCharges}</div>}
                    {(item.parkingCharges > 0 || item.tollCharges > 0) && (
                      <div className="text-blue-800">Park/Toll: ₹{item.parkingCharges + item.tollCharges}</div>
                    )}
                    {item.driverAllowance > 0 && (
                      <div className="text-purple-800">Batta: ₹{item.driverAllowance}</div>
                    )}
                    {otherTripCharges === 0 && <span className="text-slate-400">-</span>}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-950 text-sm">
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals & Words Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Left Column: Bank Details & Amount in Words */}
        <div className="space-y-4">
          {/* Amount In Words Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-0.5">
              Total Amount in Words:
            </span>
            <strong className="text-slate-900 font-semibold leading-snug block">
              {invoice.amountInWords}
            </strong>
          </div>

          {/* AUTO-POPULATED BANK DETAILS */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300/80 rounded-xl text-xs space-y-1.5">
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center justify-between border-b border-emerald-200 pb-1">
              <span>BANK DETAILS FOR NEFT / RTGS / IMPS / UPI</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-0.5">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Bank Name:</span>
                <strong className="font-semibold text-slate-900">{invoice.bankDetails?.bankName || company.bankName}</strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Account Holder:</span>
                <strong className="font-semibold text-slate-900">{invoice.bankDetails?.accountHolder || company.accountHolder}</strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Account Number:</span>
                <strong className="font-mono font-bold text-slate-950">{invoice.bankDetails?.accountNumber || company.accountNumber}</strong>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">IFSC Code:</span>
                <strong className="font-mono font-bold text-emerald-900">{invoice.bankDetails?.ifscCode || company.ifscCode}</strong>
              </div>

              <div className="col-span-2">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Branch:</span>
                <span className="text-slate-800">{invoice.bankDetails?.branchName || company.branchName}</span>
              </div>

              {(invoice.bankDetails?.upiId || company.upiId) && (
                <div className="col-span-2 pt-0.5 border-t border-emerald-200">
                  <span className="text-emerald-800 font-bold">UPI ID: </span>
                  <span className="font-mono font-bold text-slate-900">{invoice.bankDetails?.upiId || company.upiId}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial Calculation Breakdown */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 font-medium">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
          </div>

          {invoice.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Discount / Rebate:</span>
              <span className="font-mono">- {formatCurrency(invoice.discount)}</span>
            </div>
          )}

          {invoice.cgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>CGST ({invoice.taxRate / 2}%):</span>
              <span className="font-mono text-slate-900">{formatCurrency(invoice.cgst)}</span>
            </div>
          )}

          {invoice.sgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>SGST ({invoice.taxRate / 2}%):</span>
              <span className="font-mono text-slate-900">{formatCurrency(invoice.sgst)}</span>
            </div>
          )}

          {invoice.igst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>IGST ({invoice.taxRate}%):</span>
              <span className="font-mono text-slate-900">{formatCurrency(invoice.igst)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-300">
            <span>Grand Total:</span>
            <span className="font-mono text-slate-950 font-extrabold">{formatCurrency(invoice.grandTotal)}</span>
          </div>

          {invoice.advanceReceived > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Less Advance Received:</span>
              <span className="font-mono">- {formatCurrency(invoice.advanceReceived)}</span>
            </div>
          )}

          {invoice.tdsAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Less TDS ({invoice.tdsRate}%):</span>
              <span className="font-mono">- {formatCurrency(invoice.tdsAmount)}</span>
            </div>
          )}

          <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black text-slate-950 bg-emerald-100/80 p-2 rounded-lg -mx-1">
            <span className="uppercase tracking-wider">Net Balance Payable:</span>
            <span className="text-base font-mono font-black text-emerald-950">
              {formatCurrency(invoice.netPayable)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Conditions and Signature Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
            Terms & Conditions:
          </span>
          <ul className="text-[10px] text-slate-600 list-disc list-inside space-y-0.5 leading-relaxed">
            {invoice.terms?.map((t, idx) => (
              <li key={idx}>{t}</li>
            )) || <li>Payment is due within 15 days of invoice date.</li>}
          </ul>
        </div>

        <div className="text-center md:text-right flex flex-col justify-between items-end min-h-[90px]">
          <span className="text-[11px] font-black text-slate-900 uppercase">
            FOR {company.businessName || 'BISHAL TRAVELS'}
          </span>

          <div className="mt-8 pt-1 border-t border-slate-400 w-48 text-center">
            <div className="text-[11px] font-bold text-slate-900">{company.signatoryName || 'Authorized Signatory'}</div>
            <div className="text-[9px] text-slate-500 uppercase">{company.signatoryTitle || 'Proprietor / Signatory'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

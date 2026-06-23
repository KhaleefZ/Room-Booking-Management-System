import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getInvoices, downloadManualInvoice } from "../../api/invoices";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";

export default function InvoiceList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["invoices-list", search],
    queryFn: () => getInvoices({
      ...(search && { search }),
      ordering: "-created_at",
    }),
  });

  const invoices = data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Invoice Registry</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Financial Audit Track</p>
        </div>
        <Link to="/invoices/new" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl flex items-center gap-3">
          <span className="text-lg">+</span> Create Manual Invoice
        </Link>
      </div>

      {/* Visual Report Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Invoiced</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            ₹{invoices.reduce((acc, inv) => acc + Number(inv.total_amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tax Collected (GST)</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            ₹{invoices.reduce((acc, inv) => acc + Number(inv.tax_amount), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Documents</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">
            {invoices.length} <span className="text-xs text-slate-400">FILES</span>
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-6 flex items-center text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search Invoices by Guest Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-[1.5rem] pl-16 pr-8 py-4 shadow-sm text-sm font-black text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner className="py-20" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Invoice No</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Guest Details</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Room Details</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Check-In / Out</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Nights / Rooms</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Amount</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 font-bold">
                      {inv.invoice_number}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{inv.guest_name}</p>
                      <p className="text-xs text-gray-400">{inv.guest_email}</p>
                      {inv.guest_phone && <p className="text-[10px] text-gray-400">{inv.guest_phone}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-[200px] truncate" title={inv.room_details}>
                      {inv.room_details}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-600">
                      <div>{inv.check_in}</div>
                      <div>to {inv.check_out}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div>{inv.nights} Night(s)</div>
                      <div className="text-xs text-gray-400">{inv.room_count} Room(s)</div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-sm text-slate-900">
                      ₹{Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {!inv.booking && (
                          <Link
                            to={`/invoices/${inv.id}/edit`}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all"
                          >
                            Edit
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            toast.promise(downloadManualInvoice(inv.id), {
                              loading: 'Generating PDF...',
                              success: 'Invoice downloaded successfully!',
                              error: 'Failed to download invoice PDF'
                            });
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Download PDF ↓
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-gray-400 py-12">
                      No invoices found in registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

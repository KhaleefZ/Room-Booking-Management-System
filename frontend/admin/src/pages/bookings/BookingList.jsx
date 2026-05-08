import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getBookings } from "../../api/bookings";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";

const STATUSES = ["", "Pending", "Confirmed", "CheckedIn", "CheckedOut", "Cancelled"];

export default function BookingList() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings-list", status, search],
    queryFn: () => getBookings({
      ...(status && { status }),
      ...(search && { search }),
      ordering: "-created_at",
    }),
  });

  const bookings = data?.results || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-40 blur-3xl" />
        <div className="relative">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">Booking Log</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Intelligence Track</p>
        </div>
        <Link to="/bookings/new" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl flex items-center gap-3">
          <span className="text-lg">+</span> Initiate Log
        </Link>
      </div>

      {/* Visual Report Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Revenue</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">₹{bookings.reduce((acc, b) => acc + Number(b.total_amount), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Active Assets</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">{bookings.filter(b => ["Confirmed", "CheckedIn"].includes(b.status)).length}</p>
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mean Interval</p>
          <p className="text-xl font-black text-slate-900 tracking-tighter">{(bookings.reduce((acc, b) => acc + b.nights, 0) / (bookings.length || 1)).toFixed(1)} <span className="text-xs text-slate-400">NIGHTS</span></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <span className="absolute inset-y-0 left-6 flex items-center text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search Log Reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-[1.5rem] pl-16 pr-8 py-4 shadow-sm text-sm font-black text-slate-900 placeholder:text-slate-300 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 outline-none transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white border border-slate-100 rounded-[1.25rem] px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 outline-none focus:ring-4 focus:ring-brand-500/5 transition-all cursor-pointer appearance-none min-w-[200px]"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "Whole Log"}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <Spinner className="py-20" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Reference</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Guest Profile</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Asset Unit</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Ingress</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Egress</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      {String(b.reference).slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{b.guest_name}</p>
                      <p className="text-xs text-gray-400">{b.guest_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{b.room_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{b.check_in}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{b.check_out}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/bookings/${b.id}`} className="p-2 hover:bg-brand-50 rounded-lg text-brand-600 transition-colors inline-block font-bold text-xs uppercase tracking-widest">
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="table-td text-center text-gray-400 py-12">
                      No bookings found.
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
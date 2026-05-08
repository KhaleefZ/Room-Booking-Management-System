import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBooking, updateBookingStatus, updateBooking, checkoutBooking, downloadInvoice } from "../../api/bookings";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

const TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["CheckedIn", "Cancelled"],
  CheckedIn: ["CheckedOut"],
  CheckedOut: [],
  Cancelled: [],
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editGuestCount, setEditGuestCount] = useState(1);

  const { data: settings } = useQuery({
    queryKey: ["hotel-settings"],
    queryFn: async () => {
      const { getSettings } = await import("../../api/settings");
      return getSettings();
    },
  });

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const data = await getBooking(id);
      setEditGuestCount(data.guest_count);
      return data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => updateBookingStatus(id, newStatus),
    onSuccess: () => {
      toast.success("Status updated!");
      qc.invalidateQueries(["booking", id]);
      qc.invalidateQueries(["bookings-list"]);
    },
    onError: (err) => toast.error(err.response?.data?.status?.[0] || "Failed to update status."),
  });

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutBooking(id),
    onSuccess: (data) => {
      toast.success("Checkout processed & invoice sent!");
      qc.invalidateQueries(["booking", id]);
      qc.invalidateQueries(["bookings-list"]);
    },
    onError: (err) => toast.error(err.response?.data?.error || "Failed to process checkout."),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateBooking(id, data),
    onSuccess: () => {
      toast.success("Booking updated!");
      setIsEditing(false);
      qc.invalidateQueries(["booking", id]);
    },
    onError: (err) => toast.error("Failed to update booking."),
  });

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Spinner size="lg" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Decrypting Reservation Data...</p>
    </div>
  );
  if (!booking) return (
    <div className="py-20 text-center">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-gray-900 font-black text-xl">Reservation Not Found</p>
      <button onClick={() => navigate("/bookings")} className="mt-4 text-brand-600 font-bold hover:underline uppercase text-xs tracking-widest">Return to Ledger</button>
    </div>
  );

  const allowed = TRANSITIONS[booking.status] || [];

  const Row = ({ label, value, highlight = false, subtext = null }) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 group">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</span>
        {subtext && <span className="text-[9px] text-gray-300 font-bold uppercase">{subtext}</span>}
      </div>
      <span className={`text-sm font-black tracking-tight ${highlight ? 'text-brand-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header Deck */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 rounded-bl-full -mr-24 -mt-24 opacity-60" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate("/bookings")} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm"
            >
              ←
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase shrink-0">
                  REF: {String(booking.reference || "PENDING").slice(0, 8).toUpperCase()}
                </h1>
                <span className="h-1 w-1 rounded-full bg-gray-200" />
                <StatusBadge status={booking.status} className="scale-90" />
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                Logged on {booking.created_at ? format(new Date(booking.created_at), "PPP") : "N/A"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
             {allowed.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s === 'CheckedOut') {
                      if (window.confirm("Perform checkout? This will generate the final invoice and email it to the guest.")) {
                        checkoutMutation.mutate();
                      }
                    } else {
                      statusMutation.mutate(s);
                    }
                  }}
                  disabled={statusMutation.isPending || checkoutMutation.isPending}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                    s === 'Cancelled' ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-100' : 
                    s === 'CheckedOut' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' :
                    'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-100'
                  }`}
                >
                  {s === 'CheckedIn' ? 'Authorize Access' : s === 'CheckedOut' ? 'Process Checkout & Invoice' : `Mark as ${s}`}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Dossier */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs">🏨</div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Reservation Dossier</h3>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-[10px] font-black text-brand-600 uppercase tracking-widest hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                {isEditing ? 'Cancel Edit' : 'Edit Specs'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
              <div className="space-y-1">
                <Row label="Assigned Suite" value={`Suite ${booking.room?.room_number}`} subtext={booking.room?.room_type} highlight />
                
                <div className="flex justify-between items-center py-4 border-b border-gray-50">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Occupant Load</span>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                       <input
                        type="number"
                        min="1"
                        value={editGuestCount}
                        onChange={(e) => setEditGuestCount(Number(e.target.value))}
                        className="w-16 bg-gray-50 border-none rounded-xl px-3 py-1.5 text-sm font-black focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => updateMutation.mutate({ guest_count: editGuestCount })}
                        className="bg-brand-600 text-white p-1.5 rounded-lg text-xs"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-black text-gray-900">{booking.guest_count} GUESTS</p>
                  )}
                </div>

                <Row label="Stay Duration" value={`${booking.nights} NIGHTS`} />
                <Row label="Identity" value={booking.guest?.id_type || "VERIFIED"} />
              </div>
            
              <div className="space-y-1">
                <Row 
                  label="Check-in Date" 
                  value={booking.check_in ? format(new Date(booking.check_in), "dd MMM yyyy") : "N/A"} 
                  subtext={booking.status === 'Cancelled' ? '--' : `TIME: ${booking.check_in_actual_time?.slice(0, 5) || settings?.check_in_time || "14:00"}`} 
                />
                <Row 
                  label="Check-out Date" 
                  value={booking.check_out ? format(new Date(booking.check_out), "dd MMM yyyy") : "N/A"} 
                  subtext={booking.status === 'Cancelled' ? '--' : `TIME: ${booking.check_out_actual_time?.slice(0, 5) || settings?.check_out_time || "11:00"}`}
                />
                <Row label="Access Code" value={booking.reference ? booking.reference.slice(-4).toUpperCase() : "N/A"} />
                <Row label="Extra Services" value={booking.extra_bed ? "EXTRA BED INCLUDED" : "STANDARD SETUP"} />
              </div>
            </div>

            {booking.special_requests && (
              <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Internal Notes</span>
                <p className="text-sm text-gray-600 font-medium italic">"{booking.special_requests}"</p>
              </div>
            )}
          </div>

          {/* Ledger / Financials */}
          <div className="bg-gray-950 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-br-full -ml-16 -mt-16" />
             <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-xs">💸</div>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Financial Summary</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Base</span>
                  <p className="text-lg font-black tracking-tight">₹{Number(booking.base_amount).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Taxation</span>
                  <p className="text-lg font-black tracking-tight">₹{Number(booking.tax_amount).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Discounts</span>
                  <p className="text-lg font-black tracking-tight text-emerald-400">-₹{Number(booking.discount_amount).toLocaleString()}</p>
                </div>
                <div className="md:text-right">
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest block mb-1">Settlement Total</span>
                  <p className="text-2xl font-black tracking-tighter text-white">₹{Number(booking.total_amount).toLocaleString()}</p>
                </div>
              </div>
          </div>

          {booking.invoice && (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-brand-50 relative overflow-hidden">
               <div className="absolute top-4 right-4 text-[8px] font-black text-brand-600 border border-brand-600 px-2 py-1 rounded tracking-[0.3em] uppercase">OFFICIAL RECORD</div>
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center text-xs">📄</div>
                 <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Digital Invoice Issued</h3>
               </div>
               
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div>
                   <p className="text-lg font-black text-gray-900 tracking-tight">{booking.invoice.invoice_number}</p>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Issued {format(new Date(booking.invoice.issue_date), "PPP")}</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                      <p className="text-xs font-black text-gray-400 uppercase">Status</p>
                      <p className="text-sm font-black text-emerald-600 uppercase tracking-tighter">Paid & Dispatched</p>
                    </div>
                    <button 
                      onClick={() => {
                        toast.promise(downloadInvoice(booking.id), {
                          loading: 'Preparing formal invoice PDF...',
                          success: 'Invoice downloaded successfully',
                          error: 'Failed to generate PDF'
                        });
                      }}
                      className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                    >
                      Download PDF
                    </button>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Guest Profile Sidebar */}
        <div className="space-y-8">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-gray-800 to-black text-white flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-xl shadow-gray-200">
                {booking.guest?.first_name?.[0]}{booking.guest?.last_name?.[0]}
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-1">{booking.guest?.full_name}</h3>
              <p className="text-[10px] text-brand-600 font-black uppercase tracking-widest mb-6 px-4 py-1.5 bg-brand-50 rounded-full inline-block">Loyalty Profile</p>
              
              <div className="space-y-4 text-left pt-6 border-t border-gray-50">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Primary Contact</span>
                  <span className="text-sm font-bold text-gray-900">{booking.guest?.phone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Email Address</span>
                  <span className="text-sm font-bold text-gray-900 truncate">{booking.guest?.email}</span>
                </div>
              </div>

              <div className="mt-8">
                <Link 
                  to={`/guests/${booking.guest?.id}`}
                  className="block w-full py-4 rounded-2xl bg-gray-50 hover:bg-gray-100 text-[10px] font-black text-gray-900 uppercase tracking-widest transition-all"
                >
                  View Full Registry
                </Link>
              </div>
           </div>

           {/* Quick Actions / Status */}
           <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10">
                <h4 className="text-lg font-black tracking-tight mb-2">Concierge Mode</h4>
                <p className="text-indigo-100 text-xs font-medium leading-relaxed mb-6">This reservation is currently live. Any changes here will reflect across the housekeeping and kitchen modules.</p>
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Active Records Sync</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
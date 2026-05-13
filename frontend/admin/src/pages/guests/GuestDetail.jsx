import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGuest } from "../../api/guests";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function GuestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: guest, isLoading } = useQuery({
    queryKey: ["guest", id],
    queryFn: () => getGuest(id),
  });

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Spinner size="lg" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Retrieving Guest Portfolio...</p>
    </div>
  );

  if (!guest) return (
    <div className="py-20 text-center">
      <div className="text-6xl mb-4">👤</div>
      <p className="text-gray-900 font-black text-xl text-uppercase tracking-widest">Entry Error</p>
      <button onClick={() => navigate("/guests")} className="mt-4 text-brand-600 font-bold hover:underline uppercase text-xs tracking-widest">Return to Registry</button>
    </div>
  );

  const Row = ({ label, value, highlight = false }) => (
    <div className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 group">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</span>
      <span className={`text-sm font-black tracking-tight ${highlight ? 'text-brand-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Upper Registry Deck */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gray-50 rounded-bl-full -mr-24 -mt-24 opacity-60" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate("/guests")} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all shadow-sm"
            >
              ←
            </button>
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gray-900 text-white flex items-center justify-center text-xl font-black shadow-xl shadow-gray-200">
                {guest.first_name?.[0]}{guest.last_name?.[0]}
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-0.5">
                  {guest.full_name}
                </h1>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">Member since {guest.created_at ? format(new Date(guest.created_at), "MMMM yyyy") : "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link 
              to={`/guests/${id}/edit`}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 self-center"
            >
              Update Credentials
            </Link>
            <div className="px-5 py-2.5 bg-brand-50 rounded-2xl border border-brand-100 text-center">
               <span className="block text-[8px] font-black text-brand-400 uppercase mb-0.5">Booking Count</span>
               <span className="text-lg font-black text-brand-600 leading-none">{guest.total_bookings}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Records */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs">📄</div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Guest Specification</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <div className="space-y-1">
                   <Row label="Legal Name" value={guest.full_name} />
                   <Row label="Global Email" value={guest.email} />
                   <Row label="Contact Channel" value={guest.phone} />
                </div>
                <div className="space-y-1">
                   <Row label="Identity Mode" value={guest.id_type} />
                   <Row label="Serial Number" value={guest.id_number} highlight />
                   <Row label="Registry Status" value="Verified Account" />
                </div>
              </div>

              {guest.special_requests && (
                <div className="mt-8 p-6 bg-amber-50 rounded-3xl border border-amber-100">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-2">Guest Preferences</span>
                  <p className="text-sm text-amber-900 font-medium italic">"{guest.special_requests}"</p>
                </div>
              )}
          </div>

          {/* Booking History Archive */}
          <div className="space-y-4">
             <div className="flex items-center gap-3 px-4">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[10px]">🗓️</div>
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Transaction History</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guest.booking_history?.length > 0 ? (
                  guest.booking_history.map((b) => (
                    <Link
                      key={b.id}
                      to={`/bookings/${b.id}`}
                      className="group bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-brand-500 transition-all hover:shadow-xl hover:shadow-brand-100"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">REFERENCE</p>
                          <p className="text-xs font-black text-gray-900">{String(b.reference || "N/A").slice(0, 8).toUpperCase()}</p>
                        </div>
                        <StatusBadge status={b.status} className="scale-75 origin-right" />
                      </div>
                      
                      <div className="flex items-end justify-between">
                         <div>
                            <p className="text-[10px] font-bold text-gray-600 mb-1">Room {b.room_number || "TBD"} · {b.nights || 0}n</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {b.check_in ? format(new Date(b.check_in), "dd MMM") : "N/A"} → {b.check_out ? format(new Date(b.check_out), "dd MMM") : "N/A"}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-gray-900">₹{Number(b.total_amount || 0).toLocaleString()}</p>
                         </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 p-12 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Historical Records Found</p>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-6">
           <div className="bg-brand-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10">
                <h4 className="text-lg font-black tracking-tight mb-2">Concierge Suite</h4>
                <p className="text-brand-100 text-xs font-medium leading-relaxed mb-6">Access priority handling tools for this guest's future reservations.</p>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-2 h-2 rounded-full bg-emerald-400" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verified Loyalty</span>
                </div>
                <button 
                  className="w-full py-4 rounded-2xl bg-white text-brand-600 text-[10px] font-black uppercase tracking-widest hover:bg-brand-50 transition-all shadow-lg"
                  onClick={() => navigate("/bookings", { state: { guestFilter: guest.full_name } })}
                >
                  Create New Booking
                </button>
              </div>
           </div>

           <div className="bg-gray-950 p-8 rounded-[2.5rem] text-white shadow-xl">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-4">Danger Zone</span>
              <button 
                className="w-full py-3 rounded-xl border border-rose-900/50 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-950/30 transition-all"
                onClick={() => toast.error("Archival restricted for active profiles.")}
              >
                Restrict Profile
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
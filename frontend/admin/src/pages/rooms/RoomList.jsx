import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRooms, deleteRoom } from "../../api/rooms";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import toast from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Trash2, 
  Settings2, 
  Users, 
  Layers, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Coffee,
  Gem
} from "lucide-react";

export default function RoomList() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);
  const [filter, setFilter] = useState({ search: "", status: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["rooms-admin", filter],
    queryFn: () => getRooms(filter),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      toast.success("Strategic Unit Decommissioned");
      qc.invalidateQueries(["rooms-admin"]);
      setDeleteId(null);
    },
  });

  const rooms = data?.results || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/50";
      case "Occupied": return "bg-rose-50 text-rose-600 ring-1 ring-rose-200/50";
      case "Maintenance": 
      case "Cleaning": 
        return "bg-amber-50 text-amber-600 ring-1 ring-amber-200/50";
      case "Blocked": return "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50";
      default: return "bg-gray-50 text-gray-500";
    }
  };

  const getExperienceTag = (type) => {
    switch (type) {
      case "Executive Suite": 
      case "Suite": 
        return { label: "Elite", icon: <Gem size={10} />, color: "bg-purple-500" };
      case "Premium": 
        return { label: "Signature", icon: <Sparkles size={10} />, color: "bg-blue-500" };
      case "Deluxe": 
        return { label: "Elevated", icon: <Zap size={10} />, color: "bg-amber-500" };
      default: 
        return { label: "Standard", icon: <ShieldCheck size={10} />, color: "bg-slate-400" };
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Header Section */}
      <div className="relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/20 group">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-50 rounded-full -mr-48 -mt-48 opacity-40 blur-[120px] group-hover:bg-brand-100 transition-colors duration-700" />
        <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-50 text-brand-500">
                 <Layers size={14} className="animate-pulse" />
               </div>
               <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.4em]">Asset Intelligence System</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 leading-none">Command Center</h1>
            <p className="text-slate-400 font-bold text-xs max-w-lg leading-relaxed uppercase tracking-tight">Real-time oversight of precision architectural units.</p>
          </div>
          <Link to="/rooms/new" className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] hover:bg-brand-600 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl flex items-center gap-4 group/btn">
            <Plus size={18} className="group-hover/btn:rotate-90 transition-transform duration-300" />
            <span>Deploy New Unit</span>
          </Link>
        </div>

        {/* Tactical Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-12">
          {["Available", "Occupied", "Cleaning", "Maintenance", "Blocked"].map((s) => (
            <div key={s} className="bg-slate-50/40 p-5 rounded-[1.5rem] border border-slate-100/50 flex flex-col gap-2 group/stat hover:bg-white hover:shadow-2xl hover:shadow-slate-200/40 transition-all duration-500 cursor-default">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/stat:text-brand-500 transition-colors">{s} Units</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black tracking-tighter ${
                  s === 'Available' ? 'text-emerald-500' : 
                  s === 'Occupied' ? 'text-rose-500' : 
                  s === 'Cleaning' ? 'text-amber-500' : 'text-slate-900'
                }`}>
                  {rooms.filter(r => r.status === s).length.toString().padStart(2, '0')}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover/stat:bg-brand-500 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Matrix Filter */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="flex-1 relative w-full group">
          <input
            type="text"
            placeholder="Query Unit Reference (ID, Type, Status)..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full bg-white border border-slate-100 rounded-[2.5rem] px-16 py-6 shadow-sm text-sm font-black text-slate-800 placeholder:text-slate-300 focus:ring-8 focus:ring-brand-500/5 focus:border-brand-500/50 outline-none transition-all"
          />
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-500 group-focus-within:scale-110 transition-all" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto scrollbar-hide px-2">
          {["", "Available", "Occupied", "Cleaning", "Maintenance"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter({ ...filter, status: s })}
              className={`px-10 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap transition-all border ${
                filter.status === s
                ? "bg-slate-900 text-white border-transparent shadow-2xl shadow-slate-400/20 translate-y-[-4px]" 
                : "bg-white text-slate-400 hover:bg-slate-50 border-slate-100"
              }`}
            >
              {s || "Whole Matrix"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-48 flex flex-col items-center justify-center space-y-10">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-brand-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-4 border-brand-200/30 animate-pulse" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] animate-pulse">Syncing Inventory Core...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rooms.map((room) => {
            const exp = getExperienceTag(room.room_type);
            return (
              <div key={room.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] transition-all duration-700 flex flex-col scale-100 hover:scale-[1.01] hover:border-brand-100">
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={room.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent" />
                  
                  {/* Status & Experience Tags */}
                  <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                    <span className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] ${getStatusColor(room.status)} shadow-2xl backdrop-blur-md`}>
                      {room.status}
                    </span>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${exp.color} text-white text-[9px] font-black uppercase tracking-[0.1em] shadow-2xl`}>
                      {exp.icon}
                      <span>{exp.label}</span>
                    </div>
                  </div>

                  <div className="absolute bottom-8 left-10">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="w-6 h-[2px] bg-brand-500 rounded-full" />
                       <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{room.room_type || "Suite"}</p>
                    </div>
                    <h3 className="text-4xl font-black text-white tracking-tighter leading-none">Unit {room.room_number}</h3>
                  </div>
                </div>
                
                <div className="p-10 flex-1 flex flex-col">
                  {/* Detailed Specs */}
                  <div className="grid grid-cols-2 gap-6 mb-10">
                     <div className="p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Layers size={10} className="text-slate-400" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Altitude</p>
                        </div>
                        <p className="text-sm font-black text-slate-800">Level {room.floor || "01"}</p>
                     </div>
                     <div className="p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={10} className="text-slate-400" />
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacity</p>
                        </div>
                        <p className="text-sm font-black text-slate-800">{room.capacity} Perspective</p>
                     </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="mb-10 px-4">
                     <div className="flex justify-between items-end">
                       <div>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Standard Yield</p>
                         <p className="text-3xl font-black text-slate-900 tracking-tighter">₹{Number(room.base_price || 0).toLocaleString()}</p>
                       </div>
                       <div className="text-right">
                         <div className="flex items-center gap-1.5 text-emerald-500 mb-1">
                           <Sparkles size={12} />
                           <span className="text-[9px] font-black uppercase">Active</span>
                         </div>
                       </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 mt-auto pt-8 border-t border-slate-50">
                    <Link 
                      to={`/rooms/${room.id}/edit`} 
                      className="flex-1 bg-slate-50 text-slate-900 border border-slate-200 text-center py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                    >
                      <Settings2 size={12} className="group-hover/btn:rotate-45 transition-transform" />
                      <span>Configure</span>
                    </Link>
                    <button 
                      onClick={() => setDeleteId(room.id)}
                      className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100/50 hover:bg-rose-500 hover:text-white transition-all duration-300 group/del"
                    >
                      <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Unit Liquidation"
        message="This operation will permanently remove this tactical asset from the matrix. Proceed with de-annexation?"
        confirmText="Confirm"
        type="danger"
      />
    </div>
  );
}

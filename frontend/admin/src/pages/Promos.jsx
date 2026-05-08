import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPromos, createPromo, updatePromo, deletePromo } from "../api/promos";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Spinner from "../components/ui/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

const EMPTY = {
  code: "", discount_type: "percent", discount_value: "",
  expiry_date: "", usage_limit: 100, is_active: true,
};

export default function Promos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["promos"],
    queryFn: getPromos,
  });

  const promos = data?.results || [];

  const createMutation = useMutation({
    mutationFn: createPromo,
    onSuccess: () => { 
      toast.success("Marketing offer deployed!"); 
      qc.invalidateQueries(["promos"]); 
      setShowForm(false); 
      setForm(EMPTY); 
    },
    onError: () => toast.error("Deployment failed."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => updatePromo(id, { is_active }),
    onSuccess: () => { 
      toast.success("Offer status updated"); 
      qc.invalidateQueries(["promos"]); 
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromo,
    onSuccess: () => { 
      toast.success("Offer archived."); 
      qc.invalidateQueries(["promos"]); 
      setDeleteId(null);
    },
  });

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Spinner size="lg" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Synchronizing Marketing Vault...</p>
    </div>
  );

  const totalUsed = promos.reduce((acc, p) => acc + p.times_used, 0);
  const totalLimit = promos.reduce((acc, p) => acc + p.usage_limit, 0) || 1;
  const successRate = ((totalUsed / totalLimit) * 100).toFixed(1);

  const MetricCard = ({ label, value, sub, color = "brand" }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color === 'brand' ? 'blue' : color}-50 rounded-bl-full -mr-12 -mt-12 opacity-50 transition-transform group-hover:scale-110`} />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 relative z-10">{label}</p>
      <div className="flex items-baseline gap-2 relative z-10">
        <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
        <span className="text-[10px] font-bold text-gray-400 uppercase">{sub}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Marketing Suite</h1>
          <p className="text-gray-400 text-xs font-medium tracking-wide">Strategic revenue management & loyalty incentives</p>
        </div>
        <button 
          onClick={() => setShowForm(true)} 
          className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-900/20 active:scale-95"
        >
          Generate New Offer
        </button>
      </div>

      {/* Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard label="Active Campaigns" value={promos.filter(p => p.is_active).length} sub="LIVE" />
        <MetricCard label="Total Redemptions" value={totalUsed} sub="UNITS" color="emerald" />
        <MetricCard label="Conversion Rate" value={`${successRate}%`} sub="EFFICIENCY" color="indigo" />
        <MetricCard label="Vault Capacity" value={promos.length} sub="OFFERS" color="amber" />
      </div>

      {/* Offers Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {promos.map((p) => (
          <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg tracking-widest font-mono">
                    {p.code}
                  </span>
                  {p.is_active ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[8px] font-black text-emerald-600 uppercase">Active</span>
                    </div>
                  ) : (
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Archived</span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {p.discount_type === "percent" ? "Direct Percentage" : "Fixed Deduction"} Strategy
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-brand-600 tracking-tighter">
                  {p.discount_type === "percent" ? `-${p.discount_value}%` : `₹${p.discount_value}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Utilization</span>
                  <span className="text-sm font-black text-gray-900">{p.times_used}<span className="text-gray-300 text-[10px]"> / {p.usage_limit}</span></span>
               </div>
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 col-span-2">
                  <span className="block text-[8px] font-black text-gray-400 uppercase mb-1">Expiration Timeline</span>
                  <span className="text-xs font-black text-gray-900 uppercase">
                    {p.expiry_date ? format(new Date(p.expiry_date), "dd MMM yyyy") : "Perpetual"}
                  </span>
               </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => toggleMutation.mutate({ id: p.id, is_active: !p.is_active })}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  p.is_active 
                  ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                }`}
              >
                {p.is_active ? "Offline Mode" : "Activate Strategy"}
              </button>
              <button 
                onClick={() => setDeleteId(p.id)} 
                className="px-6 py-3 rounded-xl bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                Archival
              </button>
            </div>
          </div>
        ))}

        {promos.length === 0 && (
          <div className="col-span-2 p-20 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="text-5xl mb-4 opacity-20">🎟️</div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Active Strategies in Vault</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Archive Strategic Offer?"
        message="This will permanently retire the promo code from the global registry."
      />

      {/* Design System Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Marketing Strategy">
        <div className="p-2 space-y-8">
          <div className="p-6 bg-gray-900 rounded-[2rem] text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/20 rounded-bl-full" />
             <span className="text-[9px] font-black text-brand-400 uppercase mb-4 block tracking-widest">Strategic Brief</span>
             <h4 className="text-xl font-black tracking-tighter mb-1">Define Campaign</h4>
             <p className="text-gray-400 text-[10px] italic">Configure high-conversion loyalty incentives</p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Access Token (Code)</label>
              <input 
                value={form.code} 
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-500 uppercase tracking-widest" 
                placeholder="e.g. LUXURY2026" 
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Strategy Type</label>
                <select 
                  value={form.discount_type} 
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })} 
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="percent">Percentage %</option>
                  <option value="fixed">Fixed INR ₹</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Yield (Value)</label>
                <input 
                  type="number" 
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-500" 
                  placeholder={form.discount_type === "percent" ? "20" : "2000"} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">End of Life (Expiry)</label>
                <input 
                  type="date" 
                  value={form.expiry_date}
                  onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} 
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block px-1">Max Redemptions</label>
                <input 
                  type="number" 
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })}
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
             <button 
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
             >
                Abort
             </button>
             <button 
                onClick={() => createMutation.mutate(form)}
                disabled={createMutation.isPending}
                className="flex-[2] py-4 bg-brand-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-100 hover:bg-brand-700 active:scale-95 transition-all"
             >
                {createMutation.isPending ? 'Deploying...' : 'Deploy Offer'}
             </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

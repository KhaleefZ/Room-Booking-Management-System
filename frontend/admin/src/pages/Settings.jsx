import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../api/settings";
import Spinner from "../components/ui/Spinner";
import toast from "react-hot-toast";

export default function Settings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-settings"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => { toast.success("Settings saved!"); qc.invalidateQueries(["hotel-settings"]); },
    onError: () => toast.error("Failed to save settings."),
  });

  if (isLoading || !form) return <Spinner className="py-16" />;

  const Field = ({ label, name, type = "text", hint, icon }) => (
    <div className="group">
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-slate-400 group-focus-within:text-brand-500 transition-colors uppercase text-[10px]">{icon}</span>}
        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
      </div>
      <input
        type={type}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none"
      />
      {hint && <p className="text-[10px] font-medium text-slate-400 mt-2 ml-1 italic">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Global Configuration</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Core Operational Parameters</p>
        </div>
        <button
          onClick={() => mutation.mutate(form)}
          disabled={mutation.isPending}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl disabled:opacity-50"
        >
          {mutation.isPending ? "Syncing..." : "Commit Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* General */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
            <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center text-xl">🏢</div>
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Property Profile</h3>
          </div>
          <Field label="Business Name" name="hotel_name" icon="🏷️" />
          <Field label="Admin Contact Email" name="admin_email_address" type="email" icon="📧"
            hint="Primary address for all system alerts." />
          <div className="grid grid-cols-2 gap-6">
            <Field label="Default Check-In Time" name="check_in_time" type="time" icon="🕒" />
            <Field label="Default Check-Out Time" name="check_out_time" type="time" icon="🕘" />
          </div>
          <Field label="Tax Percentage (%)" name="tax_rate" type="number" icon="⚖️"
            hint="GST/VAT applied to each booking." />
        </div>

        {/* Cancellation policy */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-8">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xl">🛡️</div>
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Risk Management</h3>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Standard Cancellation Clause</label>
            <textarea
              rows={8}
              value={form.cancellation_policy || ""}
              onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
              className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-6 py-6 text-sm font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all outline-none resize-none h-full min-h-[200px]"
              placeholder="Define terms of booking termination..."
            />
          </div>
        </div>
      </div>

      {/* Email templates */}
      <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl space-y-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -mr-48 -mt-48" />
        <div className="flex items-center gap-4 border-b border-white/5 pb-6 relative z-10">
          <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center text-xl">✉️</div>
          <h3 className="font-black text-white uppercase tracking-widest text-sm">Neural Communications</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-6">
            <label className="block text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">Guest Confirmation Protocol</label>
            <div className="bg-slate-950/50 rounded-[2rem] border border-white/5 p-2 focus-within:border-brand-500 transition-colors">
              <textarea
                rows={12}
                value={form.guest_email_template || ""}
                onChange={(e) => setForm({ ...form, guest_email_template: e.target.value })}
                className="w-full bg-transparent border-none text-brand-50 font-mono text-[11px] leading-relaxed p-6 focus:ring-0 resize-none"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <label className="block text-[10px] font-black text-brand-400 uppercase tracking-[0.2em]">Command Notification Protocol</label>
            <div className="bg-slate-950/50 rounded-[2rem] border border-white/5 p-2 focus-within:border-brand-500 transition-colors">
              <textarea
                rows={12}
                value={form.admin_email_template || ""}
                onChange={(e) => setForm({ ...form, admin_email_template: e.target.value })}
                className="w-full bg-transparent border-none text-brand-50 font-mono text-[11px] leading-relaxed p-6 focus:ring-0 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/5 relative z-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 text-center">Protocol Placeholders</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["guest_name", "booking_reference", "room_name", "check_in", "check_out", "total_amount"].map(tag => (
              <code key={tag} className="bg-slate-800 text-brand-300 px-3 py-1.5 rounded-lg text-[10px] font-black border border-white/5">
                {"{{"}{tag}{"}}"}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

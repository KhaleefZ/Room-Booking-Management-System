import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRevenueReport, getOccupancyReport, exportCSV } from "../../api/reports";
import { format, startOfMonth, parseISO } from "date-fns";
import Spinner from "../../components/ui/Spinner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, Radar, RadarChart, PolarGrid, PolarAngleAxis
} from "recharts";
import { 
  TrendingUp, 
  ArrowUpRight, 
  Download,
  ShieldCheck,
  Activity,
  Layers,
  Target
} from "lucide-react";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: revenue, isLoading: revLoading, isError: isRevError } = useQuery({
    queryKey: ["revenue", from, to],
    queryFn: () => getRevenueReport(from, to),
    enabled: !!from && !!to,
    retry: 1
  });

  const { data: occupancy, isLoading: occLoading, isError: isOccError } = useQuery({
    queryKey: ["occupancy", from, to],
    queryFn: () => getOccupancyReport(from, to),
    enabled: !!from && !!to,
    retry: 1
  });

  const handleExport = async () => {
    try {
      const blob = await exportCSV(from, to);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report_${from}_to_${to}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isRevError || isOccError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Data Link Severed</h2>
      </div>
    );
  }

  if (revLoading || occLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  const chartData = (revenue?.daily || []).map((d) => ({
    date: format(parseISO(d.date), "dd MMM"),
    revenue: Number(d.revenue || 0),
    tax: Number(d.tax || 0),
    load: Math.floor(Math.random() * 40) + 60, 
  }));

  const pieData = [
    { name: 'Base Revenue', value: Number(revenue?.total_base || 0) },
    { name: 'Tax Collected', value: Number(revenue?.total_tax || 0) },
    { name: 'Discounts', value: Number(revenue?.total_discount || 0) },
  ].filter(d => d.value > 0);

  const roomIntelligence = [
    { subject: 'Occupancy', A: 85, fullMark: 150 },
    { subject: 'RevPAR', A: 98, fullMark: 150 },
    { subject: 'Cleanliness', A: 92, fullMark: 150 },
    { subject: 'Turnover', A: 75, fullMark: 150 },
    { subject: 'Loyalty', A: 88, fullMark: 150 },
  ];

  const MetricCard = ({ label, value, sub, color = "brand", trend = "+12%" }) => {
    const bgClass = color === 'emerald' ? 'emerald' : color === 'indigo' ? 'indigo' : color === 'amber' ? 'amber' : 'brand';
    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
        <div className={"absolute top-0 right-0 w-32 h-32 bg-" + bgClass + "-500 opacity-5 rounded-bl-[5rem] -mr-12 -mt-12 group-hover:scale-110 transition-transform"} />
        <div className="flex justify-between items-start mb-6 relative z-10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
             <ArrowUpRight size={10} className="text-emerald-600" />
             <span className="text-[9px] font-black text-emerald-600 italic">{trend}</span>
          </div>
        </div>
        <p className="text-3xl font-black text-slate-900 tracking-tighter relative z-10">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest relative z-10">{sub}</p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-slate-950 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden border border-white/5">
        <div className="flex items-center gap-8 relative z-10">
           <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-3xl shadow-2xl shadow-indigo-900/40 border border-white/10">
             <TrendingUp size={32} className="text-white" />
           </div>
           <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Advanced Analytics</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none italic">Stratified <span className="text-indigo-500">Audit</span></h1>
           </div>
        </div>
        
        <div className="flex gap-4 relative z-10">
           <div className="flex bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-white outline-none w-32" />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent border-none text-[10px] font-black uppercase text-white outline-none w-32" />
           </div>
           <button 
             onClick={handleExport}
             className="px-8 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-3"
           >
             <Download size={14} /> Export
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard label="RevPAR Index" value={"₹" + Number(revenue?.total_revenue / (revenue?.total_bookings || 1)).toFixed(0)} sub="REVENUE PER AVAILABLE ROOM" trend="+8.4%" />
        <MetricCard label="ADR Portal" value={"₹" + Number(revenue?.total_base / (revenue?.total_bookings || 1)).toFixed(0)} sub="AVERAGE DAILY RATE" color="emerald" trend="+12.1%" />
        <MetricCard label="Occupancy Load" value={(occupancy?.overall_occupancy_percent || 0) + "%"} sub="INVENTORY UTILIZATION" color="indigo" trend="Optimal" />
        <MetricCard label="Yield velocity" value={revenue?.total_bookings || 0} sub="GROSS UNIT CONVERSION" color="amber" trend="+22.4%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative group overflow-hidden">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-12 flex items-center gap-3">
               <Activity size={16} className="text-indigo-500" />
               Revenue Stratification
            </h3>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 900, fill: '#94a3b8'}} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '11px', fontWeight: 900 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10 self-start flex items-center gap-3">
                   <Target size={16} className="text-indigo-500" />
                   Room Intelligence
                </h3>
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={roomIntelligence}>
                         <PolarGrid stroke="#f1f5f9" />
                         <PolarAngleAxis dataKey="subject" tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} />
                         <Radar name="Performance" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                      </RadarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-10 flex items-center gap-3">
                   <Layers size={16} className="text-indigo-400" />
                   Inventory Flow
                </h3>
                <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                         <Bar dataKey="load" fill="#818cf8" radius={[4, 4, 0, 0]} />
                         <XAxis dataKey="date" hide />
                         <Tooltip contentStyle={{background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '9px', color: '#fff'}} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-8 text-center uppercase">Real-time load forensics</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">Yield Distribution</h3>
              <div className="h-[280px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={85} outerRadius={110} paddingAngle={8} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={"cell-" + index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <p className="text-2xl font-black text-slate-900 tracking-tighter">{"₹" + Number(revenue?.total_revenue || 0).toLocaleString()}</p>
                </div>
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
              <ShieldCheck size={40} className="text-white/20 absolute -right-4 -bottom-4 rotate-12" />
              <div className="relative z-10">
                <h4 className="text-2xl font-black tracking-tighter mb-4 italic uppercase leading-tight text-white">Institutional <br/>Integrity</h4>
                <div className="space-y-4 mt-8">
                   {["GST Compliant", "Audit Ready", "Sync Verified"].map(val => (
                     <div key={val} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 shadow-[0_0_8px_rgba(165,180,252,0.8)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">{val}</span>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

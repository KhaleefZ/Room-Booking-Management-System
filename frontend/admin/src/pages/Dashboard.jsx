import { useQuery } from "@tanstack/react-query";
import client from "../api/client";
import { getBookings } from "../api/bookings";
import Spinner from "../components/ui/Spinner";
import { format, isValid, parseISO, isAfter, addDays } from "date-fns";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from "recharts";
import { 
  TrendingUp, 
  Users, 
  DoorOpen, 
  Calendar, 
  ArrowUpRight,
  Clock,
  Activity,
  ArrowRight,
  PlusCircle,
  LayoutGrid,
  ListFilter
} from "lucide-react";

const fetchDashboard = () => client.get("/reports/revenue/").then(r => r.data);
const fetchOcc = () => client.get("/reports/occupancy/").then(r => r.data);

export default function Dashboard() {
  const { data: rev, isLoading: revLoading, isError: isRevError } = useQuery({ 
    queryKey: ["dash-rev"], 
    queryFn: fetchDashboard,
    retry: 1 
  });
  const { data: occ, isLoading: occLoading, isError: isOccError } = useQuery({ 
    queryKey: ["dash-occ"], 
    queryFn: fetchOcc,
    retry: 1
  });
  const { data: recentBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["dash-recent-bookings"],
    queryFn: () => getBookings({ limit: 10 }),
  });

  if (isRevError || isOccError) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mb-4">🖥️</div>
      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Intelligence Offline</h2>
      <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest max-w-xs">Mainframe reconciliation failed. Check backend credentials.</p>
    </div>
  );

  if (revLoading || occLoading || bookingsLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Mainframe...</p>
    </div>
  );

  const stats = [
    { label: "Gross Revenue", value: "₹" + Number(rev?.total_revenue || 0).toLocaleString(), icon: <TrendingUp className="text-emerald-500" />, sub: "Cycle to date", trend: "+12.5%", color: "emerald" },
    { label: "Inventory Load", value: (occ?.overall_occupancy_percent || 0) + "%", icon: <DoorOpen className="text-indigo-500" />, sub: (rev?.inventory?.occupied || 0) + " Units Active", trend: "Stable", color: "indigo" },
    { label: "Check-ins Today", value: rev?.today_bookings_count || 0, icon: <Calendar className="text-orange-500" />, sub: "Scheduled events", trend: "High", color: "orange" },
    { label: "Guest Velocity", value: rev?.inventory?.occupied || 0, icon: <Users className="text-blue-500" />, sub: "Active residents", trend: "+4%", color: "blue" },
  ];

  const today = new Date();
  const bookingsData = Array.isArray(recentBookings) ? recentBookings : recentBookings?.results || [];
  
  const nextBookings = (bookingsData || [])
    .filter(b => b.check_in && isAfter(parseISO(b.check_in), today))
    .sort((a,b) => parseISO(a.check_in).getTime() - parseISO(b.check_in).getTime())
    .slice(0, 3);

  const timelineData = [
    { day: "Today", val: (bookingsData || []).filter(b => b.check_in && format(parseISO(b.check_in), "yyyy-MM-dd") === format(today, "yyyy-MM-dd")).length },
    { day: "Tomorrow", val: (bookingsData || []).filter(b => b.check_in && format(parseISO(b.check_in), "yyyy-MM-dd") === format(addDays(today, 1), "yyyy-MM-dd")).length },
    { day: "Next Day", val: (bookingsData || []).filter(b => b.check_in && format(parseISO(b.check_in), "yyyy-MM-dd") === format(addDays(today, 2), "yyyy-MM-dd")).length },
    { day: "Upcoming", val: (bookingsData || []).filter(b => b.check_in && isAfter(parseISO(b.check_in), addDays(today, 2))).length },
  ];

  const chartData = (rev?.daily || []).map(d => {
    let name = d.date;
    try {
      const parsed = parseISO(d.date);
      if (isValid(parsed)) {
        name = format(parsed, "dd MMM");
      }
    } catch (e) {
      console.warn("Dash date issue:", e);
    }
    return { name, rev: Number(d.revenue || 0) };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <p className="text-slate-500 text-[9px] font-black tracking-[0.3em] uppercase">System Status: Optimal</p>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 uppercase">
            Executive <span className="text-indigo-600">Intelligence</span>
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{format(new Date(), "EEEE, MMMM dd")}</p>
            <div className="h-px w-8 bg-slate-200" />
            <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">v2.4.9 Stable</p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Link 
            to="/bookings" 
            className="px-8 py-4 bg-indigo-600 shadow-xl shadow-indigo-500/20 text-white rounded-[1.5rem] flex items-center gap-3 group hover:bg-indigo-700 transition-all active:scale-95 border border-white/10"
          >
            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-80">Bookings</p>
              <p className="text-[12px] font-black uppercase tracking-tighter">Initiate Log</p>
            </div>
          </Link>

          <Link 
            to="/rooms" 
            className="px-8 py-4 bg-slate-900 shadow-xl shadow-slate-900/10 text-white rounded-[1.5rem] flex items-center gap-3 group hover:bg-slate-800 transition-all active:scale-95 border border-white/5"
          >
            <LayoutGrid size={18} className="group-hover:scale-110 transition-transform text-indigo-400" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none opacity-60">Inventory</p>
              <p className="text-[12px] font-black uppercase tracking-tighter">Add New Unit</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className={"absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-5 bg-" + s.color + "-500 -mr-8 -mt-8 group-hover:scale-110 transition-transform"} />
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full">
                <ArrowUpRight size={10} className="text-emerald-600" />
                <span className="text-[9px] font-black text-emerald-600 uppercase italic">{s.trend}</span>
              </div>
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{s.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
              <div className="h-0.5 w-full bg-slate-50 mt-4 rounded-full overflow-hidden">
                <div className={"h-full bg-" + s.color + "-500 w-1/2 rounded-full"} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 tracking-widest">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Yield Trajectory</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Inter-period financial flow</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Revenue Flow</span>
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="#475569" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    cursor={{ stroke: '#312e81', strokeWidth: 2 }}
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '11px', fontWeight: 900, color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="rev" stroke="#818cf8" strokeWidth={4} fillOpacity={1} fill="url(#dashGrad)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Activity size={16} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Security Ledger</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Authorized operations</p>
                </div>
              </div>
              <Link to="/bookings" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:gap-3 flex items-center gap-2 transition-all">
                Full Ledger <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Guest ID</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookingsData.slice(0, 5).map((booking) => (
                    <tr key={booking.id} className="group/row hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 tracking-tight group-hover/row:text-indigo-600 transition-colors">{booking.guest_name}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Room {booking.room_number || "Suite"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={"px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm " + (
                          booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          booking.status?.includes('In') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          booking.status?.includes('Out') ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          'bg-slate-50 text-slate-400'
                        )}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex flex-col items-end">
                           <span className="font-black text-slate-900 text-xs">₹{Number(booking.total_amount || 0).toLocaleString()}</span>
                           <span className={"text-[8px] font-bold uppercase tracking-widest mt-0.5 " + (
                             booking.status === 'Cancelled' ? 'text-red-400' :
                             booking.payment_id ? 'text-emerald-500' : 'text-orange-400'
                           )}>
                             {booking.status === 'Cancelled' ? 'Voided' : booking.payment_id ? 'Verified' : 'Unpaid'}
                           </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">Next Logistics</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Scheduled arrivals</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:rotate-12">
                   <Clock size={18} />
                </div>
              </div>

              <div className="space-y-6">
                 {nextBookings.length > 0 ? nextBookings.map((b, i) => (
                   <div key={b.id} className="flex gap-5 items-start">
                      <div className="flex flex-col items-center">
                         <div className={"w-1.5 h-1.5 rounded-full " + (i === 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-200')} />
                         {i !== nextBookings.length - 1 && <div className="w-px h-12 bg-slate-100 my-1" />}
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{b.guest_name}</span>
                            <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{format(parseISO(b.check_in), "dd MMM")}</span>
                         </div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Room {b.room_number || "TBD"}</p>
                      </div>
                   </div>
                 )) : (
                   <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-[2rem]">
                      <p className="text-[9px] font-black text-slate-300 uppercase italic">No pending arrivals</p>
                   </div>
                 )}
              </div>
              
              <Link to="/bookings" className="mt-10 w-full py-4 bg-slate-50 rounded-2xl flex items-center justify-center gap-2 group/btn hover:bg-indigo-600 transition-all">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/btn:text-white transition-colors">View All Logistics</span>
                 <ArrowRight size={12} className="text-slate-300 group-hover/btn:text-white transition-colors" />
              </Link>
           </div>

           <div className="bg-slate-950 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 relative z-10 flex items-center gap-3">
                 <ListFilter size={16} className="text-indigo-500" />
                 Ops Timeline
              </h3>
              <div className="h-[200px] w-full relative z-10">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData}>
                       <Bar dataKey="val" radius={[4, 4, 0, 0]} barSize={30}>
                          {timelineData.map((entry, index) => (
                             <Cell key={"cell-" + index} fill={index === 0 ? '#6366f1' : '#1e293b'} stroke={index === 0 ? 'transparent' : '#334155'} strokeWidth={1} />
                          ))}
                       </Bar>
                       <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 900, fill: '#475569'}} dy={10} />
                       <Tooltip cursor={false} contentStyle={{background: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '9px', fontWeight: 900}} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-8 text-center">Unit velocity forensics</p>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col group">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Unit Overview</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status Distribution</p>
                </div>
              </div>
              
              <div className="space-y-8">
                 {[
                   { label: "Available Units", val: rev?.inventory?.available || 0, icon: "🟢", color: "bg-emerald-500", text: "text-emerald-600", total: rev?.inventory?.total },
                   { label: "Executive Hold", val: rev?.inventory?.occupied || 0, icon: "🔵", color: "bg-indigo-500", text: "text-indigo-600", total: rev?.inventory?.total  },
                   { label: "Under Service", val: rev?.inventory?.maintenance || 0, icon: "🟠", color: "bg-orange-500", text: "text-orange-600", total: rev?.inventory?.total  },
                 ].map(item => (
                   <div key={item.label} className="group/unit hover:translate-x-1 transition-all">
                     <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] group-hover/unit:bg-indigo-50 transition-colors border border-slate-100">{item.icon}</div>
                         <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.label}</span>
                       </div>
                       <span className={"text-xs font-black " + item.text}>{item.val}</span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                       <div className={"h-full rounded-full " + item.color} style={{ width: ((item.val / (item.total || 1)) * 100) + "%" }} />
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

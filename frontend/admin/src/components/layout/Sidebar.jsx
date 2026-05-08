import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const NAV = [
  { to: "/", icon: "📊", label: "Intelligence", sub: "Terminal" },
  { to: "/rooms", icon: "🏨", label: "Inventory", sub: "Suites" },
  { to: "/bookings", icon: "📅", label: "Operations", sub: "Ledger" },
  { to: "/guests", icon: "👥", label: "Accounts", sub: "Patrons" },
  { to: "/promos", icon: "🎟️", label: "Marketing", sub: "Access Tokens" },
  { to: "/reports", icon: "📈", label: "Analytics", sub: "Telemetry" },
  { to: "/settings", icon: "⚙️", label: "Control", sub: "Configuration" },
];

export default function Sidebar() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Terminal Session Ended");
    navigate("/login");
  };

  return (
    <aside className="w-[280px] bg-slate-950 min-h-screen flex flex-col fixed left-0 top-0 z-40 border-r border-slate-800/50">
      {/* Brand - High End Identity */}
      <div className="px-8 py-10">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 relative z-10 border border-white/10">
              <span className="text-white font-black text-xl italic tracking-tighter">R</span>
            </div>
          </div>
          <div>
            <p className="text-white font-black text-sm tracking-[0.2em] uppercase leading-none mb-1">RBMS / 0.1</p>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Enterprise Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Ecosystem */}
      <nav className="flex-1 px-4 space-y-2">
        <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Core Modules</p>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => `
              group flex items-center gap-4 px-4 py-3.5 rounded-[1.25rem] transition-all duration-300
              ${isActive 
                ? "bg-brand-600 text-white shadow-xl shadow-brand-900/40 translate-x-1" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 hover:translate-x-1"
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110
                  ${isActive ? "bg-white/10" : "bg-slate-900"}
                `}>
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">{item.label}</span>
                  <span className={`text-[9px] font-bold ${isActive ? "text-brand-100" : "text-slate-500"}`}>{item.sub}</span>
                </div>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* System Exit */}
      <div className="p-6 mt-auto">
        <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800/50">
          <button
            onClick={handleLogout}
            className="group flex items-center gap-4 w-full px-3 py-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all hover:bg-red-500/5"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-red-500/20 flex items-center justify-center text-sm transition-colors group-hover:text-red-400 font-bold">
              🚪
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-red-400 transition-colors">Terminate</p>
              <p className="text-[9px] font-bold text-slate-600">Secure Exit</p>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
}

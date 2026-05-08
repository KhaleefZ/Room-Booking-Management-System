import { useLocation } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const TITLES = {
  "/": "Dashboard",
  "/rooms": "Rooms",
  "/bookings": "Bookings",
  "/guests": "Guests",
  "/promos": "Promo Codes",
  "/reports": "Reports",
  "/settings": "Settings",
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { user } = useAuthStore();

  const title = Object.entries(TITLES).find(([path]) =>
    pathname === path || (path !== "/" && pathname.startsWith(path))
  )?.[1] || "Admin";

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-8 md:px-10 sticky top-0 z-30">
      <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{title}</h1>
      <div className="flex items-center gap-4 bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
          <span className="text-white font-black text-sm uppercase">
            {user?.username?.[0] || "A"}
          </span>
        </div>
        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
          {user?.username || "admin"}
        </span>
      </div>
    </header>
  );
}
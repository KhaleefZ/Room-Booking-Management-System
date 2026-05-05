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
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="font-semibold text-gray-900 text-lg">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
          <span className="text-brand-600 font-semibold text-sm">
            {user?.username?.[0]?.toUpperCase() || "A"}
          </span>
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {user?.username || "Admin"}
        </span>
      </div>
    </header>
  );
}
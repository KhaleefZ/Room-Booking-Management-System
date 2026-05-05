import { NavLink, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const NAV = [
  { to: "/", icon: "📊", label: "Dashboard" },
  { to: "/rooms", icon: "🏨", label: "Rooms" },
  { to: "/bookings", icon: "📅", label: "Bookings" },
  { to: "/guests", icon: "👥", label: "Guests" },
  { to: "/promos", icon: "🎟️", label: "Promo Codes" },
  { to: "/reports", icon: "📈", label: "Reports" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
];

export default function Sidebar() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <aside className="w-60 bg-gray-900 min-h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">RBMS Admin</p>
            <p className="text-gray-500 text-xs">HaizoTech</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              isActive ? "sidebar-link-active" : "sidebar-link-inactive"
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="sidebar-link-inactive w-full text-left"
        >
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
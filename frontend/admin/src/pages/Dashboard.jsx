import { useQuery } from "@tanstack/react-query";
import { getBookings } from "../api/bookings";
import { getRooms } from "../api/rooms";
import { getGuests } from "../api/guests";
import { getRevenueReport } from "../api/reports";
import { format, startOfMonth } from "date-fns";
import StatusBadge from "../components/ui/StatusBadge";
import Spinner from "../components/ui/Spinner";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const today = format(new Date(), "yyyy-MM-dd");
const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

export default function Dashboard() {
  const { data: bookingsData } = useQuery({
    queryKey: ["bookings-dashboard"],
    queryFn: () => getBookings({ ordering: "-created_at" }),
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-dashboard"],
    queryFn: () => getRooms({}),
  });

  const { data: guestsData } = useQuery({
    queryKey: ["guests-dashboard"],
    queryFn: () => getGuests({}),
  });

  const { data: revenueData } = useQuery({
    queryKey: ["revenue-dashboard"],
    queryFn: () => getRevenueReport(monthStart, today),
  });

  const bookings = bookingsData?.results || [];
  const rooms = roomsData?.results || [];
  const guests = guestsData?.results || [];

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const checkInsToday = bookings.filter((b) => b.check_in === todayStr).length;
  const checkOutsToday = bookings.filter((b) => b.check_out === todayStr).length;
  const occupiedRooms = rooms.filter((r) => r.status === "Occupied").length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;

  const stats = [
    { label: "Today's Check-ins", value: checkInsToday, icon: "🏨", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Today's Check-outs", value: checkOutsToday, icon: "👋", color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Available Rooms", value: availableRooms, icon: "✅", color: "text-green-600", bg: "bg-green-50" },
    { label: "Total Guests", value: guests.length, icon: "👥", color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const chartData = revenueData?.daily?.map((d) => ({
    date: format(new Date(d.date), "dd MMM"),
    revenue: Number(d.revenue),
    bookings: d.booking_count,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="stat-card flex items-center gap-4">
            <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Revenue This Month</h2>
          <span className="text-sm text-gray-500">
            Total: ₹{Number(revenueData?.total_revenue || 0).toLocaleString()}
          </span>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(val) => [`₹${Number(val).toLocaleString()}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-52 flex items-center justify-center text-gray-400 text-sm">
            No revenue data for this month yet.
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Bookings</h2>
          <Link to="/bookings" className="text-brand-600 text-sm font-medium hover:underline">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Reference</th>
                <th className="table-th">Guest</th>
                <th className="table-th">Room</th>
                <th className="table-th">Check-in</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.slice(0, 5).map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-mono text-xs text-gray-400">
                    {String(b.reference).slice(0, 8).toUpperCase()}
                  </td>
                  <td className="table-td font-medium">{b.guest_name}</td>
                  <td className="table-td">{b.room_number}</td>
                  <td className="table-td">{b.check_in}</td>
                  <td className="table-td font-medium">₹{Number(b.total_amount).toLocaleString()}</td>
                  <td className="table-td">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="table-td text-center text-gray-400 py-8">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room Status */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Room Status</h2>
          <Link to="/rooms" className="text-brand-600 text-sm font-medium hover:underline">
            Manage
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-th">Room</th>
                <th className="table-th">Type</th>
                <th className="table-th">Floor</th>
                <th className="table-th">Price/Night</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rooms.slice(0, 5).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-td font-medium">Room {r.room_number}</td>
                  <td className="table-td">{r.room_type}</td>
                  <td className="table-td">{r.floor}</td>
                  <td className="table-td">₹{Number(r.base_price).toLocaleString()}</td>
                  <td className="table-td"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-td text-center text-gray-400 py-8">
                    No rooms added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
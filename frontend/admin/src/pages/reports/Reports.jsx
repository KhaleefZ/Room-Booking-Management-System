import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRevenueReport, getOccupancyReport, exportCSV } from "../../api/reports";
import { format, startOfMonth, subMonths } from "date-fns";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export default function Reports() {
  const [from, setFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exporting, setExporting] = useState(false);

  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["revenue", from, to],
    queryFn: () => getRevenueReport(from, to),
    enabled: !!from && !!to,
  });

  const { data: occupancy, isLoading: occLoading } = useQuery({
    queryKey: ["occupancy", from, to],
    queryFn: () => getOccupancyReport(from, to),
    enabled: !!from && !!to,
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportCSV(from, to);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings_${from}_to_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const chartData = revenue?.daily?.map((d) => ({
    date: format(new Date(d.date), "dd MMM"),
    revenue: Number(d.revenue),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Date range + export */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-auto" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-auto" />
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => { setFrom(format(startOfMonth(subMonths(new Date(), 1)), "yyyy-MM-dd")); setTo(format(new Date(), "yyyy-MM-dd")); }}
            className="btn-secondary"
          >
            Last Month
          </button>
          <button onClick={handleExport} disabled={exporting} className="btn-primary">
            {exporting ? "Exporting..." : "⬇ Export CSV"}
          </button>
        </div>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{Number(revenue?.total_revenue || 0).toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">{revenue?.total_bookings || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Overall Occupancy</p>
          <p className="text-2xl font-bold text-gray-900">
            {occupancy?.overall_occupancy_percent || 0}%
          </p>
        </div>
      </div>

      {/* Revenue chart */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue</h3>
        {revLoading ? (
          <Spinner className="py-16" />
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-12 text-sm">No revenue data for this period.</p>
        )}
      </div>

      {/* Occupancy table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Room Occupancy</h3>
        </div>
        {occLoading ? (
          <Spinner className="py-10" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Room</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Occupied Nights</th>
                  <th className="table-th">Total Nights</th>
                  <th className="table-th">Occupancy %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {occupancy?.rooms?.map((r) => (
                  <tr key={r.room_id} className="hover:bg-gray-50">
                    <td className="table-td font-medium">Room {r.room_number}</td>
                    <td className="table-td">{r.room_type}</td>
                    <td className="table-td">{r.occupied_nights}</td>
                    <td className="table-td">{r.total_nights}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-24">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full"
                            style={{ width: `${r.occupancy_percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{r.occupancy_percent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!occupancy?.rooms?.length && (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-gray-400 py-8">
                      No data for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
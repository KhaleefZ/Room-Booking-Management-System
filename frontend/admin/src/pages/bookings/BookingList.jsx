import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getBookings } from "../../api/bookings";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";

const STATUSES = ["", "Pending", "Confirmed", "CheckedIn", "CheckedOut", "Cancelled"];

export default function BookingList() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["bookings-list", status, search],
    queryFn: () => getBookings({
      ...(status && { status }),
      ...(search && { search }),
      ordering: "-created_at",
    }),
  });

  const bookings = data?.results || [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search guest name, email, reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input-field w-auto"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || "All Statuses"}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center">
          {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <Spinner className="py-16" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Reference</th>
                  <th className="table-th">Guest</th>
                  <th className="table-th">Room</th>
                  <th className="table-th">Check-in</th>
                  <th className="table-th">Check-out</th>
                  <th className="table-th">Nights</th>
                  <th className="table-th">Total</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-mono text-xs text-gray-400">
                      {String(b.reference).slice(0, 8).toUpperCase()}
                    </td>
                    <td className="table-td">
                      <p className="font-medium text-gray-900">{b.guest_name}</p>
                      <p className="text-xs text-gray-400">{b.guest_email}</p>
                    </td>
                    <td className="table-td">{b.room_number}</td>
                    <td className="table-td">{b.check_in}</td>
                    <td className="table-td">{b.check_out}</td>
                    <td className="table-td">{b.nights}</td>
                    <td className="table-td font-medium">₹{Number(b.total_amount).toLocaleString()}</td>
                    <td className="table-td"><StatusBadge status={b.status} /></td>
                    <td className="table-td">
                      <Link to={`/bookings/${b.id}`} className="btn-secondary py-1 px-3">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={9} className="table-td text-center text-gray-400 py-12">
                      No bookings found.
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
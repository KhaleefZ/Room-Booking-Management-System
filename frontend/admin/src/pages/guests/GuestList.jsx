import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getGuests } from "../../api/guests";
import Spinner from "../../components/ui/Spinner";

export default function GuestList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["guests-list", search],
    queryFn: () => getGuests({ ...(search && { search }) }),
  });

  const guests = data?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-xs"
        />
        <span className="text-sm text-gray-500">
          {guests.length} guest{guests.length !== 1 ? "s" : ""}
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
                  <th className="table-th">Name</th>
                  <th className="table-th">Email</th>
                  <th className="table-th">Phone</th>
                  <th className="table-th">Total Bookings</th>
                  <th className="table-th">Registered</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {guests.map((g) => (
                  <tr key={g.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-medium">{g.full_name}</td>
                    <td className="table-td text-gray-500">{g.email}</td>
                    <td className="table-td">{g.phone}</td>
                    <td className="table-td">{g.total_bookings}</td>
                    <td className="table-td text-gray-400 text-xs">{g.created_at?.slice(0, 10)}</td>
                    <td className="table-td">
                      <Link to={`/guests/${g.id}`} className="btn-secondary py-1 px-3">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {guests.length === 0 && (
                  <tr>
                    <td colSpan={6} className="table-td text-center text-gray-400 py-12">
                      No guests yet.
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
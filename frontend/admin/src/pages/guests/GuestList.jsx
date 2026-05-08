import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getGuests } from "../../api/guests";
import Spinner from "../../components/ui/Spinner";

import { format } from "date-fns";

export default function GuestList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["guests-list", search],
    queryFn: () => getGuests({ ...(search && { search }) }),
  });

  const guests = data?.results || [];

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Guest Registry</h1>
          <p className="text-sm text-gray-400 font-medium">Manage and search your customers</p>
        </div>
        <div className="flex gap-2">
           <span className="text-xs font-bold bg-brand-50 text-brand-600 px-4 py-2 rounded-full h-fit self-center">
            {guests.length} TOTAL GUESTS
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email, phone or identity number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full bg-white shadow-sm border-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center space-y-4">
            <Spinner size="lg" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Fetching Registry...</p>
          </div>
        ) : (
          guests.map((g) => (
            <div key={g.id} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xl font-black uppercase tracking-widest shadow-lg shadow-brand-100">
                  {g.full_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black text-gray-900 truncate">{g.full_name}</h3>
                  <p className="text-xs text-brand-600 font-bold uppercase tracking-tighter">Member since {format(new Date(g.created_at), "MMM yyyy")}</p>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase">Phone</span>
                  <span className="text-gray-900 font-black">{g.phone}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase">Identity</span>
                  <span className="text-gray-900 font-black">
                    {g.id_type ? `${g.id_type} — ${g.id_number}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase">Total Bookings</span>
                  <span className="bg-brand-50 text-brand-700 px-2 py-0.5 rounded-md font-black">{g.total_bookings}</span>
                </div>
              </div>

              <div className="pt-5 mt-2">
                <Link to={`/guests/${g.id}`} className="block w-full text-center py-2.5 rounded-xl border border-gray-100 text-xs font-black text-gray-700 hover:bg-gray-50 transition-colors uppercase tracking-widest">
                  View Profile
                </Link>
              </div>
            </div>
          ))
        )}
        {!isLoading && guests.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-400 font-black text-xl mb-2">No Guests Found</p>
            <p className="text-gray-400 text-sm">Try searching for a different name or phone number.</p>
          </div>
        )}
      </div>
    </div>
  );
}
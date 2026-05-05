import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../api/rooms";
import RoomCard from "../components/ui/RoomCard";
import Spinner from "../components/ui/Spinner";

const ROOM_TYPES = ["All", "Standard", "Deluxe", "Suite", "Family"];

export default function Rooms() {
  const [filter, setFilter] = useState({ room_type: "", ordering: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", filter],
    queryFn: () => getRooms({
      ...(filter.room_type && { room_type: filter.room_type }),
      ...(filter.ordering && { ordering: filter.ordering }),
    }),
  });

  const rooms = data?.results || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="section-title">Our Rooms</h1>
          <p className="section-subtitle">Choose from our selection of comfortable rooms</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <div className="flex flex-wrap gap-2">
            {ROOM_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setFilter((f) => ({ ...f, room_type: t === "All" ? "" : t }))}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (t === "All" && !filter.room_type) || filter.room_type === t
                    ? "bg-brand-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-brand-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <select
            value={filter.ordering}
            onChange={(e) => setFilter((f) => ({ ...f, ordering: e.target.value }))}
            className="ml-auto input-field w-auto text-sm py-2"
          >
            <option value="">Sort: Default</option>
            <option value="base_price">Price: Low to High</option>
            <option value="-base_price">Price: High to Low</option>
            <option value="floor">Floor: Low to High</option>
          </select>
        </div>

        {/* Results */}
        {isLoading ? (
          <Spinner className="py-24" />
        ) : rooms.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">{rooms.length} room{rooms.length !== 1 ? "s" : ""} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">🏨</div>
            <p className="text-lg font-medium">No rooms found</p>
            <p className="text-sm mt-1">Try changing your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
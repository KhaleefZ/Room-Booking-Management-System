import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../api/rooms";
import RoomCard from "../components/ui/RoomCard";
import Spinner from "../components/ui/Spinner";

export default function Rooms() {
  const [filter, setFilter] = useState({ room_type: "Standard", ordering: "", search: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["rooms", filter],
    queryFn: () => getRooms({
      ...(filter.room_type && { room_type: filter.room_type }),
      ...(filter.ordering && { ordering: filter.ordering }),
      ...(filter.search && { search: filter.search }),
    }),
  });

  const rooms = data?.results || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">Our Rooms</h1>
              <p className="text-lg text-gray-500 max-w-2xl">
                Experience unparalleled comfort in our signature rooms. Each room is thoughtfully designed to be your perfect sanctuary.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ● Housekeeping Daily
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ● 24/7 Room Service
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                ● Amenities snacks and beverages
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="relative w-full md:w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by room number or features..."
              value={filter.search}
              onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
              className="input-field pl-10 w-full"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Sort by:</label>
            <select
              value={filter.ordering}
              onChange={(e) => setFilter((f) => ({ ...f, ordering: e.target.value }))}
              className="input-field w-full md:w-48 text-sm py-2"
            >
              <option value="">Default Listing</option>
              <option value="base_price">Price: Low to High</option>
              <option value="-base_price">Price: High to Low</option>
              <option value="floor">Floor: Low to High</option>
              <option value="room_number">Room Number</option>
            </select>
          </div>
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
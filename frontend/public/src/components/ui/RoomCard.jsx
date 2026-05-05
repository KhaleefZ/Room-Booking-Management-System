import { Link } from "react-router-dom";

export default function RoomCard({ room }) {
  return (
    <div className="card group hover:shadow-md transition-shadow duration-200">
      {/* Photo */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {room.primary_photo ? (
          <img
            src={room.primary_photo}
            alt={`Room ${room.room_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            room.status === "Available"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {room.status}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
          <span className="text-brand-600 font-bold text-sm">
            ₹{Number(room.base_price).toLocaleString()}
          </span>
          <span className="text-gray-500 text-xs">/night</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900">Room {room.room_number}</h3>
            <p className="text-brand-600 text-sm font-medium">{room.room_type}</p>
          </div>
          <span className="text-gray-400 text-xs">Floor {room.floor}</span>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span>🛏 {room.bed_config}</span>
          <span>👥 Up to {room.capacity} guests</span>
          {room.amenity_count > 0 && <span>✨ {room.amenity_count} amenities</span>}
        </div>

        <Link
          to={`/rooms/${room.id}`}
          className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            room.status === "Available"
              ? "btn-primary"
              : "bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none"
          }`}
        >
          {room.status === "Available" ? "View & Book" : "Unavailable"}
        </Link>
      </div>
    </div>
  );
}
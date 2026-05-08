import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../api/rooms";
import RoomCard from "../components/ui/RoomCard";
import Spinner from "../components/ui/Spinner";
import logo from "../assets/logo.png";

export default function Home() {
  const { data, isLoading } = useQuery({
    queryKey: ["rooms", { status: "Available" }],
    queryFn: () => getRooms({ status: "Available" }),
  });

  const rooms = data?.results?.slice(0, 3) || [];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gray-900 text-white min-h-[85vh] flex items-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-center bg-no-repeat bg-[length:auto_80%] md:bg-contain opacity-100 pointer-events-none"
          style={{ backgroundImage: `url(${logo})` }}
        />
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 bg-brand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🏨", value: "50+", label: "Rooms" },
              { icon: "⭐", value: "4.9", label: "Rating" },
              { icon: "🎉", value: "10K+", label: "Happy Guests" },
              { icon: "📅", value: "24/7", label: "Support" },
            ].map((h) => (
              <div key={h.label} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-3xl mb-2">{h.icon}</div>
                <div className="font-bold text-2xl text-gray-900">{h.value}</div>
                <div className="text-gray-500 text-sm">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured rooms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Featured Rooms</h2>
            <p className="section-subtitle">Handpicked stays for the perfect experience</p>
          </div>

          {isLoading ? (
            <Spinner className="py-16" />
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-16">No rooms available right now.</p>
          )}

          <div className="text-center mt-10">
            <Link to="/rooms" className="btn-primary inline-block">
              View All Rooms
            </Link>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Hotel Amenities</h2>
            <p className="section-subtitle">Everything you need for a perfect stay</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: "🌊", label: "Swimming Pool" },
              { icon: "🏋️", label: "Fitness Center" },
              { icon: "🍽️", label: "Restaurant" },
              { icon: "📶", label: "Free Wi-Fi" },
              { icon: "🚗", label: "Free Parking" },
              { icon: "🧖", label: "Spa & Wellness" },
            ].map((a) => (
              <div key={a.label} className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{a.icon}</div>
                <p className="text-sm font-medium text-gray-700">{a.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-serif text-4xl font-bold mb-4">Ready to Book Your Stay?</h2>
          <p className="text-brand-100 text-lg mb-8">
            Check availability, choose your room, and book in minutes.
          </p>
          <Link to="/rooms" className="bg-white text-brand-600 hover:bg-brand-50 font-bold px-10 py-4 rounded-xl inline-block transition-colors">
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
}
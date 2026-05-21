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
    <div className="bg-[#fcfaf6]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#e9dfd5] bg-gradient-to-br from-[#f7f1ea] via-[#fbf8f4] to-[#f2e8df]">
        <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_top_left,_rgba(163,110,37,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(45,33,31,0.08),_transparent_30%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-24 items-center min-h-[500px]">
            {/* Left Section: Logo Only */}
            <div className="flex items-center justify-center order-1 w-full h-full">
              <img
                src={logo}
                alt="Sri ASK Residency Logo"
                className="w-full h-auto max-w-full lg:scale-110 drop-shadow-[0_20px_60px_rgba(45,33,31,0.25)] transition-transform duration-700 hover:scale-[1.12]"
              />
            </div>

            {/* Right Section: Content */}
            <div className="space-y-8 lg:pl-4 order-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#d8c6b2] bg-white/80 px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.35em] text-[#9a6c2f] shadow-sm backdrop-blur-sm">
                Sri ASK Residency
                <span className="h-1.5 w-1.5 rounded-full bg-[#c97a1a] animate-pulse" />
                Stay simple
              </div>

              <div className="space-y-6">
                <p className="text-xs font-black uppercase tracking-[0.5em] text-[#9aa6ba]">Comfort made clear</p>
                <h1 className="font-serif text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-[#2d211f] leading-[1.05]">
                  A calm stay,<br className="hidden sm:block" /> designed around your day.
                </h1>
                <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed text-[#61534b]">
                  A clean, direct booking experience with smart rooms, practical amenities, and everything you need to settle in quickly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-5 pt-6">
                <Link to="/rooms" className="btn-primary inline-flex items-center justify-center rounded-full px-12 py-5 text-sm font-black uppercase tracking-widest shadow-xl shadow-brand-200/40 hover:-translate-y-0.5 transition-all">
                  Explore Rooms
                </Link>
                <Link to="/gallery" className="inline-flex items-center justify-center rounded-full border border-[#d8c6b2] bg-white/70 px-12 py-5 text-sm font-bold text-[#2d211f] transition-all hover:bg-white hover:shadow-md">
                  View Gallery
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured rooms */}
      <section className="py-18 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#9aa6ba]">Selected stays</p>
              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-bold text-[#2d211f]">Featured Rooms</h2>
            </div>
            <p className="max-w-xl text-sm sm:text-base leading-7 text-[#61534b]">
              A short list of rooms that balance comfort, price, and clarity.
            </p>
          </div>

          <div className="mb-8 h-px w-full bg-[#e9dfd5]" />

          <div className="text-center mb-12 hidden">
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
    </div>
  );
}
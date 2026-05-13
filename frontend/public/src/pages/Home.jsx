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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pt-12 lg:pb-20">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-14 items-center">
            <div className="relative order-1 lg:order-1">
              <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-[2.5rem] bg-[#2d211f]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-[#3b2a27] p-6 sm:p-8 shadow-[0_30px_80px_-24px_rgba(45,33,31,0.45)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(202,150,79,0.18),_transparent_40%)]" />

                <div className="relative flex min-h-[520px] flex-col gap-6 rounded-[2rem] border border-white/10 bg-[#3b2a27]/70 p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.45em] text-[#d7b384]">Residency identity</p>
                      <p className="max-w-sm text-sm leading-6 text-[#efe6dc]">
                        A refined home base for work, rest, and short stays with a straightforward guest experience.
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b384]">
                      Simple · Innovative
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3">
                    {[
                      { num: "01", label: "Choose" },
                      { num: "02", label: "Book" },
                      { num: "03", label: "Rest" },
                    ].map((step, index) => (
                      <div key={step.num} className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#4a3732] text-[10px] font-black tracking-[0.3em] text-[#d7b384]">
                          {step.num}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#efe6dc]">{step.label}</div>
                          <div className="mt-1 text-[10px] text-[#bfa79d]">{index === 0 ? "Pick a room" : index === 1 ? "Reserve simply" : "Settle in"}</div>
                        </div>
                        {index < 2 && <div className="hidden h-px flex-1 bg-white/10 sm:block" />}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-white/10 bg-[#4a3732]/80 px-6 py-10">
                    <img
                      src={logo}
                      alt="Sri Ask Residency"
                      className="w-full max-w-[32rem] drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[#efe6dc]">
                    {[
                      "Peaceful rooms",
                      "Easy booking",
                      "Guest-first support",
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center text-xs font-semibold leading-5">
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#d7b384]">Plan ahead</p>
                      <p className="mt-1 text-sm font-semibold text-[#efe6dc]">Browse rooms, check details, and book in a few steps.</p>
                    </div>
                    <Link to="/rooms" className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-[#c97a1a] px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-white transition-colors hover:bg-[#b96e11]">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 lg:pl-10 order-2">
              <div className="inline-flex items-center gap-3 rounded-full border border-[#d8c6b2] bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-[#9a6c2f] shadow-sm">
                Sri Ask Residency
                <span className="h-1.5 w-1.5 rounded-full bg-[#c97a1a]" />
                Stay simple
              </div>

              <div className="space-y-6">
                <p className="text-[11px] font-black uppercase tracking-[0.45em] text-[#9aa6ba]">Comfort made clear</p>
                <h1 className="max-w-xl font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#2d211f] leading-[0.95]">
                  A calm stay, designed around your day.
                </h1>
                <p className="max-w-xl text-base sm:text-lg leading-8 text-[#61534b]">
                  A clean, direct booking experience with smart rooms, practical amenities, and everything you need to settle in quickly.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link to="/rooms" className="btn-primary inline-flex items-center justify-center rounded-full px-10 py-5 text-sm font-black uppercase tracking-widest shadow-lg shadow-brand-200/40">
                  Explore Rooms
                </Link>
                <Link to="/gallery" className="inline-flex items-center justify-center rounded-full border border-[#d8c6b2] bg-white/70 px-10 py-5 text-sm font-semibold text-[#2d211f] transition-colors hover:bg-white">
                  View Gallery
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <div className="animate-bounce rounded-full border border-[#d8c6b2] bg-white/80 px-3 py-2 text-xs text-[#9aa6ba] shadow-sm">
              ↓
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
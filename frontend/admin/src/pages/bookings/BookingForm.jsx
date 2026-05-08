import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRooms } from "../../api/rooms";
import { getGuests } from "../../api/guests";
import { createBooking } from "../../api/bookings";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import { format, addDays } from "date-fns";

export default function BookingForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    guest_id: "",
    room_id: "",
    check_in: format(new Date(), "yyyy-MM-dd"),
    check_out: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    extra_bed: false,
    guest_count: 1,
    status: "Confirmed",
  });

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-available"],
    queryFn: () => getRooms({ status: "Available" }),
  });

  const { data: guestsData } = useQuery({
    queryKey: ["guests-all"],
    queryFn: () => getGuests({}),
  });

  const rooms = roomsData?.results || [];
  const guests = guestsData?.results || [];

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      toast.success("Booking created successfully!");
      qc.invalidateQueries(["bookings-list"]);
      qc.invalidateQueries(["rooms-dashboard"]);
      navigate("/bookings");
    },
    onError: (err) => {
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        Object.values(errorData).forEach(val => toast.error(String(val)));
      } else {
        toast.error("Failed to create booking. Check if room is available.");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.guest_id || !form.room_id) {
      toast.error("Please select both a guest and a room.");
      return;
    }
    mutation.mutate(form);
  };

  return (
    <div className="max-w-2xl mx-auto pb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-brand-600 p-6 text-white">
          <h1 className="text-xl font-bold">Create New Booking</h1>
          <p className="text-brand-100 text-sm">Fill in the details below to reserve a room.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Guest</label>
              <select
                value={form.guest_id}
                onChange={(e) => setForm({ ...form, guest_id: e.target.value })}
                className="input-field w-full h-11"
                required
              >
                <option value="">-- Select Guest --</option>
                {guests.map(g => (
                  <option key={g.id} value={g.id}>{g.first_name} {g.last_name} ({g.phone})</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400">Can't find guest? Add them in Guests page first.</p>
            </div>

            {/* Room Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Room</label>
              <select
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                className="input-field w-full h-11"
                required
              >
                <option value="">-- Available Rooms --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>Room {r.room_number} - ₹{r.base_price}/night</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Check-in Date</label>
              <input
                type="date"
                value={form.check_in}
                min={format(new Date(), "yyyy-MM-dd")}
                onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                className="input-field w-full h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Check-out Date</label>
              <input
                type="date"
                value={form.check_out}
                min={form.check_in}
                onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                className="input-field w-full h-11"
                required
              />
            </div>

            {/* Guest Count & Extra Bed */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Number of Guests</label>
              <input
                type="number"
                min="1"
                max="4"
                value={form.guest_count}
                onChange={(e) => setForm({ ...form, guest_count: parseInt(e.target.value) })}
                className="input-field w-full h-11"
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="extra_bed"
                checked={form.extra_bed}
                onChange={(e) => setForm({ ...form, extra_bed: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="extra_bed" className="text-sm font-bold text-gray-700">Extra Bed (+₹500)</label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50 flex gap-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 btn-primary py-3 font-bold"
            >
              {mutation.isPending ? "Processing..." : "Confirm Booking"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/bookings")}
              className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

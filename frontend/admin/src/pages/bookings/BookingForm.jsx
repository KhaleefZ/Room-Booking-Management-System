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
  const [isNewGuest, setIsNewGuest] = useState(false);

  const [form, setForm] = useState({
    guest_id: "",
    room_id: "",
    check_in: format(new Date(), "yyyy-MM-dd"),
    check_out: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    extra_bed: false,
    guest_count: 1,
    status: "Confirmed",
    // New guest fields
    full_name: "",
    email: "",
    phone: "",
    country_code: "+91",
    id_type: "Aadhaar",
    id_number: "",
    address: "",
  });

  const countryCodes = [
    { code: "+91", label: "India (+91)", flag: "🇮🇳" },
    { code: "+1", label: "USA (+1)", flag: "🇺🇸" },
    { code: "+44", label: "UK (+44)", flag: "🇬🇧" },
    { code: "+971", label: "UAE (+971)", flag: "🇦🇪" },
    { code: "+65", label: "Singapore (+65)", flag: "🇸🇬" },
    { code: "+61", label: "Australia (+61)", flag: "🇦🇺" },
    { code: "+966", label: "Saudi Arabia (+966)", flag: "🇸🇦" },
    { code: "+1", label: "Canada (+1)", flag: "🇨🇦" },
    { code: "+49", label: "Germany (+49)", flag: "🇩🇪" },
    { code: "+33", label: "France (+33)", flag: "🇫🇷" },
  ];

  const { data: roomsData } = useQuery({
    queryKey: ["rooms-available"],
    queryFn: () => getRooms({}),
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
    if (!isNewGuest && !form.guest_id) {
      toast.error("Please select a guest.");
      return;
    }
    if (!form.room_id) {
      toast.error("Please select a room.");
      return;
    }

    const payload = { ...form };
    if (isNewGuest) {
      delete payload.guest_id;
      // Combine country code and phone
      payload.phone = `${form.country_code}${form.phone.replace(/^0+/, '')}`;
      delete payload.country_code;
    } else {
      // Remove new guest fields if choosing existing
      delete payload.full_name;
      delete payload.email;
      delete payload.phone;
      delete payload.id_type;
      delete payload.id_number;
      delete payload.address;
    }

    mutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-brand-600 p-6 text-white">
          <h1 className="text-xl font-bold">Create New Booking</h1>
          <p className="text-brand-100 text-sm">Fill in the details below to reserve a room.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setIsNewGuest(false)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isNewGuest ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
            >
              EXISTING GUEST
            </button>
            <button
              type="button"
              onClick={() => setIsNewGuest(true)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${isNewGuest ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
            >
              NEW GUEST
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guest Selection */}
            {!isNewGuest ? (
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
                    <option key={g.id} value={g.id}>{g.full_name} ({g.phone})</option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="input-field w-full h-11"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field w-full h-11"
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone number</label>
                  <div className="flex gap-2">
                    <select
                      value={form.country_code}
                      onChange={(e) => setForm({ ...form, country_code: e.target.value })}
                      className="input-field w-48 h-11"
                    >
                      {countryCodes.map(c => (
                        <option key={`${c.code}-${c.label}`} value={c.code}>{c.flag} {c.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                      className="input-field flex-1 h-11"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Type</label>
                  <select
                    value={form.id_type}
                    onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                    className="input-field w-full h-11"
                    required
                  >
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="PAN">PAN</option>
                    <option value="Passport">Passport</option>
                    <option value="DrivingLicense">Driving License</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">ID Number</label>
                  <input
                    type="text"
                    value={form.id_number}
                    onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                    className="input-field w-full h-11"
                    placeholder="ID details"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="input-field w-full h-11"
                    placeholder="City, State"
                    required
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 border-t border-gray-50 pt-4"></div>

            {/* Room Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Room</label>
              <select
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                className="input-field w-full h-11"
                required
              >
                <option value="">-- All Rooms --</option>
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field w-full h-11 font-bold text-brand-600"
                required
              >
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
              </select>
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

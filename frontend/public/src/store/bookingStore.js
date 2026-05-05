import { create } from "zustand";

const useBookingStore = create((set) => ({
  // Step 1 — dates + room
  roomId: null,
  roomData: null,
  checkIn: null,
  checkOut: null,
  nights: 0,

  // Step 2 — guest details
  guestDetails: {
    full_name: "",
    email: "",
    phone: "",
    id_type: "Aadhaar",
    id_number: "",
    special_requests: "",
    guest_count: 1,
  },

  // Step 3 — promo + pricing
  promoCode: "",
  promoResult: null,
  pricing: null,

  // Created booking
  bookingId: null,
  bookingReference: null,

  // Current wizard step
  step: 1,

  // Actions
  setRoom: (room) => set({ roomId: room.id, roomData: room }),
  setDates: (checkIn, checkOut, nights) => set({ checkIn, checkOut, nights }),
  setGuestDetails: (details) => set({ guestDetails: details }),
  setPromo: (code, result) => set({ promoCode: code, promoResult: result }),
  setPricing: (pricing) => set({ pricing }),
  setBooking: (id, reference) => set({ bookingId: id, bookingReference: reference }),
  setStep: (step) => set({ step }),

  reset: () =>
    set({
      roomId: null, roomData: null,
      checkIn: null, checkOut: null, nights: 0,
      guestDetails: {
        full_name: "", email: "", phone: "",
        id_type: "Aadhaar", id_number: "",
        special_requests: "", guest_count: 1,
      },
      promoCode: "", promoResult: null, pricing: null,
      bookingId: null, bookingReference: null,
      step: 1,
    }),
}));

export default useBookingStore;
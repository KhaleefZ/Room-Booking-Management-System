import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useBookingStore from "../store/bookingStore";
import BookingSteps from "../components/ui/BookingSteps";
import PriceBreakdown from "../components/ui/PriceBreakdown";
import { createBooking, createPaymentOrder, verifyPayment } from "../api/bookings";
import { validatePromo } from "../api/promos";

const ID_TYPES = ["Aadhaar", "PAN", "Passport", "DrivingLicense"];

export default function BookingPage() {
  const navigate = useNavigate();
  const store = useBookingStore();
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  // Redirect if no room selected
  if (!store.roomData) {
    navigate("/rooms");
    return null;
  }

  const { roomData, checkIn, checkOut, nights, guestDetails, promoResult, step } = store;

  // Step 2 — Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      store.setBooking(data.id, data.reference);
      store.setStep(3);
      initiatePayment(data.id);
    },
    onError: (err) => {
      const msg = err.response?.data;
      if (typeof msg === "string") toast.error(msg);
      else if (msg?.non_field_errors) toast.error(msg.non_field_errors[0]);
      else toast.error("Booking failed. Please try again.");
    },
  });

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const payload = {
      room_id: roomData.id,
      check_in: checkIn,
      check_out: checkOut,
      ...guestDetails,
      promo_code: store.promoCode || "",
    };
    bookingMutation.mutate(payload);
  };

  const handlePromoValidate = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    try {
      const baseAmount = Number(roomData.base_price) * nights;
      const result = await validatePromo(promoInput.trim(), baseAmount);
      store.setPromo(promoInput.trim().toUpperCase(), result);
      if (result.is_valid) toast.success(result.message);
      else toast.error(result.message);
    } catch {
      toast.error("Failed to validate promo code.");
    } finally {
      setPromoLoading(false);
    }
  };

  const initiatePayment = async (bookingId) => {
    try {
      const order = await createPaymentOrder(bookingId);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "HotelRBMS",
        description: `Booking ${order.booking_reference}`,
        order_id: order.order_id,
        prefill: {
          name: order.guest_name,
          email: order.guest_email,
        },
        theme: { color: "#b86d16" },
        handler: async (response) => {
          try {
            await verifyPayment({
              booking_id: bookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Payment successful!");
            navigate("/booking/confirmation");
            store.reset();
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => toast.error("Payment cancelled. Your booking is held for 15 minutes."),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error("Failed to initiate payment. Please try again.");
      store.setStep(2);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="font-serif text-3xl font-bold text-gray-900 text-center mb-2">
          Complete Your Booking
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Room {roomData.room_number} · {roomData.room_type} ·{" "}
          {checkIn} → {checkOut} · {nights} night{nights > 1 ? "s" : ""}
        </p>

        <BookingSteps current={step} />

        {/* Step 2 — Guest Details */}
        {step === 2 && (
          <div className="card p-6 space-y-6">
            <h2 className="font-semibold text-gray-900 text-lg">Guest Information</h2>

            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={guestDetails.full_name}
                    onChange={(e) => store.setGuestDetails({ ...guestDetails, full_name: e.target.value })}
                    className="input-field"
                    placeholder="As on your ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={guestDetails.email}
                    onChange={(e) => store.setGuestDetails({ ...guestDetails, email: e.target.value })}
                    className="input-field"
                    placeholder="Confirmation sent here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    value={guestDetails.phone}
                    onChange={(e) => store.setGuestDetails({ ...guestDetails, phone: e.target.value })}
                    className="input-field"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. of Guests <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    max={roomData.capacity}
                    value={guestDetails.guest_count}
                    onChange={(e) => store.setGuestDetails({ ...guestDetails, guest_count: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={guestDetails.id_type}
                    onChange={(e) => store.setGuestDetails({ ...guestDetails, id_type: e.target.value })}
                    className="input-field"
                  >
                    {ID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={guestDetails.id_number}
                    onChange={(e) => store.setGuestDetails({ ...guestDetails, id_number: e.target.value })}
                    className="input-field"
                    placeholder="Enter ID number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  rows={3}
                  value={guestDetails.special_requests}
                  onChange={(e) => store.setGuestDetails({ ...guestDetails, special_requests: e.target.value })}
                  className="input-field resize-none"
                  placeholder="Any dietary needs, room preferences, etc."
                />
              </div>

              {/* Promo code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="input-field"
                    placeholder="Enter promo code"
                  />
                  <button
                    type="button"
                    onClick={handlePromoValidate}
                    disabled={promoLoading}
                    className="btn-secondary text-sm px-4 whitespace-nowrap"
                  >
                    {promoLoading ? "Checking..." : "Apply"}
                  </button>
                </div>
                {promoResult?.is_valid && (
                  <p className="text-green-600 text-xs mt-1">
                    ✓ {promoResult.message}
                  </p>
                )}
              </div>

              {/* Price breakdown */}
              <PriceBreakdown
                room={roomData}
                nights={nights}
                promoResult={promoResult}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={bookingMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {bookingMutation.isPending ? "Processing..." : "Proceed to Payment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3 — Payment loading */}
        {step === 3 && (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="font-semibold text-gray-900 text-lg mb-2">Opening Payment</h2>
            <p className="text-gray-500 text-sm">
              Razorpay payment window is opening. Complete your payment there.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
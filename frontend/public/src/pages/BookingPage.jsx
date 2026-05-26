import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import useBookingStore from "../store/bookingStore";
import BookingSteps from "../components/ui/BookingSteps";
import PriceBreakdown from "../components/ui/PriceBreakdown";
import { createBooking, createPaymentOrder, verifyPayment } from "../api/bookings";
import { checkIdExists } from "../api/guests";
import { validatePromo } from "../api/promos";
import { getPublicSettings } from "../api/settings";
import { validateAadhaar, validatePAN, validatePassport } from "../utils/validators";

const ID_TYPES = ["Aadhaar", "PAN", "Passport", "DrivingLicense"];

const COUNTRY_CODES = [
  { code: "+91", country: "India" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+971", country: "UAE" },
  { code: "+61", country: "Australia" },
  { code: "+65", country: "Singapore" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+81", country: "Japan" },
];

export default function BookingPage() {
  const navigate = useNavigate();
  const store = useBookingStore();
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicSettings,
  });

  // Redirect if no room selected
  if (!store.roomData) {
    navigate("/rooms");
    return null;
  }

  const { roomData, checkIn, checkOut, nights, guestDetails, promoResult, step } = store;

  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [idChecking, setIdChecking] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 2 — Create booking mutation
  const bookingMutation = useMutation({
    mutationFn: (data) => createBooking({ ...data, phone: countryCode + phoneNumber }),
    onSuccess: (data) => {
      store.setBooking(data.id, data.reference);
      store.setStep(3);
      initiatePayment(data.id);
    },
    onError: (err) => {
      const msg = err.response?.data;
      if (typeof msg === "string") toast.error(msg);
      else if (msg) {
        setErrors(msg);
        if (msg.non_field_errors) toast.error(msg.non_field_errors[0]);
        else toast.error("Please correct the errors in the form.");
      } else {
        toast.error("Booking failed. Please try again.");
      }
    },
  });

  const validate = () => {
    const newErrors = {};
    if (guestDetails.full_name.trim().length < 3) {
      newErrors.full_name = "Name must be at least 3 characters.";
    }
    if (!phoneNumber.match(/^\d{10}$/)) {
      newErrors.phone = "Phone must be exactly 10 digits.";
    }
    
    const idVal = guestDetails.id_number.trim().toUpperCase();

    if (idVal.length < 5) {
      newErrors.id_number = "ID Number is too short.";
    }
    
    // Aadhaar specific
    if (guestDetails.id_type === "Aadhaar" && !validateAadhaar(idVal)) {
      newErrors.id_number = "Invalid Aadhaar number (Check digits or checksum).";
    }
    
    // PAN specific
    if (guestDetails.id_type === "PAN" && !validatePAN(idVal)) {
      newErrors.id_number = "PAN format invalid (ABCDE1234F).";
    }

    // Passport specific
    if (guestDetails.id_type === "Passport" && !validatePassport(idVal)) {
      newErrors.id_number = "Passport format invalid (e.g., Z1234567).";
    }

    if (guestDetails.address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Phase 3: Duplicate Check
    setIdChecking(true);
    try {
      const { exists } = await checkIdExists(guestDetails.id_number.trim().toUpperCase());
      if (exists) {
        toast.error("An account with this ID already exists. Please contact support or use a different email/ID.");
        setErrors(prev => ({ ...prev, id_number: "Already registered." }));
        setIdChecking(false);
        return;
      }
    } catch (err) {
      console.error("ID verification failed", err);
    } finally {
      setIdChecking(false);
    }

    const payload = {
      room_id: roomData.id,
      check_in: checkIn,
      check_out: checkOut,
      ...guestDetails,
      id_number: guestDetails.id_number.trim().toUpperCase(),
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
        name: settings?.hotel_name || "Sri ASK Residency",
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
                    onChange={(e) => {
                      store.setGuestDetails({ ...guestDetails, full_name: e.target.value });
                      if (errors.full_name) setErrors({...errors, full_name: null});
                    }}
                    className={`input-field ${errors.full_name ? 'border-red-500' : ''}`}
                    placeholder="As on your ID"
                  />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={guestDetails.email}
                    onChange={(e) => {
                      store.setGuestDetails({ ...guestDetails, email: e.target.value });
                      if (errors.email) setErrors({...errors, email: null});
                    }}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="Confirmation sent here"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="input-field w-32 px-2 text-sm"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} ({c.country})
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                        if (errors.phone) setErrors({...errors, phone: null});
                      }}
                      className={`input-field flex-1 ${errors.phone ? 'border-red-500' : ''}`}
                      placeholder="9876543210"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
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
                    onChange={(e) => {
                      store.setGuestDetails({ ...guestDetails, id_number: e.target.value });
                      if (errors.id_number) setErrors({...errors, id_number: null});
                    }}
                    className={`input-field ${errors.id_number ? 'border-red-500' : ''}`}
                    placeholder="Enter ID number"
                  />
                  {errors.id_number && <p className="text-red-500 text-xs mt-1">{errors.id_number}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={guestDetails.address}
                    onChange={(e) => {
                      store.setGuestDetails({ ...guestDetails, address: e.target.value });
                      if (errors.address) setErrors({...errors, address: null});
                    }}
                    className={`input-field resize-none ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="Enter your full physical address"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="extra_bed"
                      checked={guestDetails.extra_bed}
                      onChange={(e) => store.setGuestDetails({ ...guestDetails, extra_bed: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="extra_bed" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Need an extra bed? (Check if yes)
                    </label>
                  </div>
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
                extraBed={guestDetails.extra_bed}
                taxRate={settings?.tax_rate || 18}
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
                  disabled={bookingMutation.isPending || idChecking}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {idChecking ? "Verifying..." : bookingMutation.isPending ? "Processing..." : "Proceed to Payment"}
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
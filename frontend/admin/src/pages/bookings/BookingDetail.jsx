import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBooking, updateBookingStatus } from "../../api/bookings";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";

const TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["CheckedIn", "Cancelled"],
  CheckedIn: ["CheckedOut"],
  CheckedOut: [],
  Cancelled: [],
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => getBooking(id),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => updateBookingStatus(id, newStatus),
    onSuccess: () => {
      toast.success("Status updated!");
      qc.invalidateQueries(["booking", id]);
      qc.invalidateQueries(["bookings-list"]);
    },
    onError: (err) => toast.error(err.response?.data?.status?.[0] || "Failed to update status."),
  });

  if (isLoading) return <Spinner className="py-16" />;
  if (!booking) return <p className="text-gray-400">Booking not found.</p>;

  const allowed = TRANSITIONS[booking.status] || [];

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/bookings")} className="btn-secondary">← Back</button>
        <div>
          <h2 className="font-semibold text-gray-900">
            Booking {String(booking.reference).slice(0, 8).toUpperCase()}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Created {booking.created_at?.slice(0, 10)}</p>
        </div>
        <div className="ml-auto"><StatusBadge status={booking.status} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Booking info */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
          <Row label="Room" value={`Room ${booking.room?.room_number} (${booking.room?.room_type})`} />
          <Row label="Check-in" value={booking.check_in} />
          <Row label="Check-out" value={booking.check_out} />
          <Row label="Nights" value={booking.nights} />
          <Row label="Base Amount" value={`₹${Number(booking.base_amount).toLocaleString()}`} />
          <Row label="Discount" value={`₹${Number(booking.discount_amount).toLocaleString()}`} />
          <Row label="Tax" value={`₹${Number(booking.tax_amount).toLocaleString()}`} />
          <Row label="Total" value={`₹${Number(booking.total_amount).toLocaleString()}`} />
          {booking.promo_code_str && <Row label="Promo Code" value={booking.promo_code_str} />}
          {booking.payment_id && <Row label="Payment ID" value={booking.payment_id} />}
        </div>

        {/* Guest info */}
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Guest Details</h3>
          <Row label="Name" value={booking.guest?.full_name} />
          <Row label="Email" value={booking.guest?.email} />
          <Row label="Phone" value={booking.guest?.phone} />
          {booking.special_requests && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Special Requests</p>
              <p className="text-sm text-gray-700">{booking.special_requests}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status update */}
      {allowed.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Update Status</h3>
          <div className="flex gap-3 flex-wrap">
            {allowed.map((s) => (
              <button
                key={s}
                onClick={() => statusMutation.mutate(s)}
                disabled={statusMutation.isPending}
                className={s === "Cancelled" ? "btn-danger" : "btn-primary"}
              >
                Mark as {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
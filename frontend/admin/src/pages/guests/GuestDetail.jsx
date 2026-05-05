import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getGuest } from "../../api/guests";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import { Link } from "react-router-dom";

export default function GuestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: guest, isLoading } = useQuery({
    queryKey: ["guest", id],
    queryFn: () => getGuest(id),
  });

  if (isLoading) return <Spinner className="py-16" />;
  if (!guest) return <p className="text-gray-400">Guest not found.</p>;

  const Row = ({ label, value }) => (
    <div className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/guests")} className="btn-secondary">← Back</button>
        <div>
          <h2 className="font-semibold text-gray-900">{guest.full_name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{guest.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Guest Information</h3>
          <Row label="Full Name" value={guest.full_name} />
          <Row label="Email" value={guest.email} />
          <Row label="Phone" value={guest.phone} />
          <Row label="ID Type" value={guest.id_type} />
          <Row label="ID Number" value={guest.id_number} />
          <Row label="Total Bookings" value={guest.total_bookings} />
          <Row label="Registered" value={guest.created_at?.slice(0, 10)} />
          {guest.special_requests && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 font-medium mb-1">Special Requests</p>
              <p className="text-sm text-gray-700">{guest.special_requests}</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Booking History ({guest.total_bookings})
          </h3>
          <div className="space-y-3">
            {guest.booking_history?.length > 0 ? (
              guest.booking_history.map((b) => (
                <Link
                  key={b.id}
                  to={`/bookings/${b.id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs text-gray-400">
                      {String(b.reference).slice(0, 8).toUpperCase()}
                    </span>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{b.room_number} · {b.nights}n</span>
                    <span className="font-medium">₹{Number(b.total_amount).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{b.check_in} → {b.check_out}</p>
                </Link>
              ))
            ) : (
              <p className="text-gray-400 text-sm">No bookings yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
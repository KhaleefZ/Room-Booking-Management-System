export default function StatusBadge({ status }) {
  const map = {
    Available:   "badge-green",
    Occupied:    "badge-blue",
    Maintenance: "badge-yellow",
    Blocked:     "badge-red",
    Pending:     "badge-yellow",
    Confirmed:   "badge-blue",
    CheckedIn:   "badge-green",
    CheckedOut:  "badge-gray",
    Cancelled:   "badge-red",
  };
  return (
    <span className={map[status] || "badge-gray"}>
      {status}
    </span>
  );
}
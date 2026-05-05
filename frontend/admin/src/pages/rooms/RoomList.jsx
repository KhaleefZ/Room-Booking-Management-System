import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRooms, deleteRoom } from "../../api/rooms";
import StatusBadge from "../../components/ui/StatusBadge";
import Spinner from "../../components/ui/Spinner";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import toast from "react-hot-toast";

export default function RoomList() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["rooms-admin"],
    queryFn: () => getRooms({}),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      toast.success("Room deleted.");
      qc.invalidateQueries(["rooms-admin"]);
    },
    onError: () => toast.error("Cannot delete room with active bookings."),
  });

  const rooms = data?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{rooms.length} room{rooms.length !== 1 ? "s" : ""}</p>
        <Link to="/rooms/new" className="btn-primary">+ Add Room</Link>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <Spinner className="py-16" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Room</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Floor</th>
                  <th className="table-th">Bed</th>
                  <th className="table-th">Capacity</th>
                  <th className="table-th">Price/Night</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-td font-semibold">Room {r.room_number}</td>
                    <td className="table-td">{r.room_type}</td>
                    <td className="table-td">{r.floor}</td>
                    <td className="table-td text-xs">{r.bed_config}</td>
                    <td className="table-td">{r.capacity}</td>
                    <td className="table-td font-medium">₹{Number(r.base_price).toLocaleString()}</td>
                    <td className="table-td"><StatusBadge status={r.status} /></td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <Link to={`/rooms/${r.id}/edit`} className="btn-secondary py-1 px-3">
                          Edit
                        </Link>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="btn-danger py-1 px-3"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rooms.length === 0 && (
                  <tr>
                    <td colSpan={8} className="table-td text-center text-gray-400 py-12">
                      No rooms yet. <Link to="/rooms/new" className="text-brand-600 underline">Add your first room</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Room"
        message="Are you sure you want to delete this room? This cannot be undone."
      />
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRoom, createRoom, updateRoom,
  getAmenities, createAmenity,
  uploadRoomPhoto, deleteRoomPhoto,
} from "../../api/rooms";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Family"];
const STATUSES = ["Available", "Occupied", "Maintenance", "Blocked"];

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    room_number: "", room_type: "Standard", floor: 1,
    bed_config: "", capacity: 2, base_price: "",
    status: "Available", description: "", amenity_ids: [],
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const { data: room, isLoading: roomLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: () => getRoom(id),
    enabled: isEdit,
  });

  const { data: amenitiesData } = useQuery({
    queryKey: ["amenities"],
    queryFn: getAmenities,
  });

  const amenities = amenitiesData?.results || [];

  useEffect(() => {
    if (room) {
      setForm({
        room_number: room.room_number,
        room_type: room.room_type,
        floor: room.floor,
        bed_config: room.bed_config,
        capacity: room.capacity,
        base_price: room.base_price,
        status: room.status,
        description: room.description || "",
        amenity_ids: room.amenities?.map((a) => a.id) || [],
      });
    }
  }, [room]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateRoom(id, data) : createRoom(data),
    onSuccess: (data) => {
      toast.success(isEdit ? "Room updated!" : "Room created!");
      qc.invalidateQueries(["rooms-admin"]);
      if (!isEdit) navigate(`/rooms/${data.id}/edit`);
    },
    onError: (err) => {
      const msg = err.response?.data;
      toast.error(typeof msg === "object" ? JSON.stringify(msg) : "Failed to save room.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !id) return;
    setPhotoUploading(true);
    try {
      await uploadRoomPhoto(id, photoFile);
      toast.success("Photo uploaded!");
      qc.invalidateQueries(["room", id]);
      setPhotoFile(null);
    } catch {
      toast.error("Photo upload failed.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await deleteRoomPhoto(id, photoId);
      toast.success("Photo deleted.");
      qc.invalidateQueries(["room", id]);
    } catch {
      toast.error("Failed to delete photo.");
    }
  };

  const toggleAmenity = (amenityId) => {
    setForm((f) => ({
      ...f,
      amenity_ids: f.amenity_ids.includes(amenityId)
        ? f.amenity_ids.filter((a) => a !== amenityId)
        : [...f.amenity_ids, amenityId],
    }));
  };

  if (isEdit && roomLoading) return <Spinner className="py-16" />;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/rooms")} className="btn-secondary">← Back</button>
        <h2 className="font-semibold text-gray-900">{isEdit ? `Edit Room ${room?.room_number}` : "Add New Room"}</h2>
      </div>

      {/* Room details form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Room Details</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
            <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })}
              className="input-field" placeholder="e.g. 101" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
            <select value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} className="input-field">
              {ROOM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor *</label>
            <input required type="number" min={1} value={form.floor}
              onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bed Configuration *</label>
            <input required value={form.bed_config} onChange={(e) => setForm({ ...form, bed_config: e.target.value })}
              className="input-field" placeholder="e.g. 1 King, 2 Twin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
            <input required type="number" min={1} value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹/night) *</label>
            <input required type="number" min={0} value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })} className="input-field" placeholder="e.g. 2500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field">
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field resize-none" placeholder="Room description..." />
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAmenity(a.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.amenity_ids.includes(a.id)
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                  }`}
                >
                  {a.icon} {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-3">
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Room"}
          </button>
          <button type="button" onClick={() => navigate("/rooms")} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>

      {/* Photo upload — only shown when editing */}
      {isEdit && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Room Photos</h3>

          {/* Existing photos */}
          {room?.photos?.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {room.photos.map((p) => (
                <div key={p.id} className="relative group rounded-xl overflow-hidden">
                  <img src={p.cloudinary_url} alt="" className="w-full h-28 object-cover" />
                  {p.is_primary && (
                    <span className="absolute top-2 left-2 bg-brand-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Primary
                    </span>
                  )}
                  <button
                    onClick={() => handleDeletePhoto(p.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload new photo */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files[0])}
                className="input-field text-sm"
              />
            </div>
            <button
              onClick={handlePhotoUpload}
              disabled={!photoFile || photoUploading}
              className="btn-primary"
            >
              {photoUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            First photo uploaded automatically becomes the primary photo.
          </p>
        </div>
      )}
    </div>
  );
}
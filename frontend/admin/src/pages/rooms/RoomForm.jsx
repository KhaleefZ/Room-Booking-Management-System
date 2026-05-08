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
import { 
  ArrowLeft, 
  MapPin, 
  Layers, 
  Users, 
  Bed, 
  Tag, 
  Info, 
  Layout, 
  Sparkles, 
  Camera, 
  CheckCircle2, 
  X,
  CreditCard,
  Briefcase
} from "lucide-react";

const ROOM_TYPES = ["Standard", "Deluxe", "Premium", "Suite", "Executive Suite"];
const STATUSES = ["Available", "Occupied", "Cleaning", "Maintenance", "Blocked"];

export default function RoomForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState({
    room_number: "", room_type: "Standard", floor: 1,
    bed_config: "", capacity: 2, base_price: "",
    status: "Available", description: "", amenity_ids: [],
    extra_bed: false, address: "",
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
        extra_bed: room.extra_bed === 1,
        address: room.address || "",
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
    const payload = {
      ...form,
      extra_bed: form.extra_bed ? 1 : 0
    };
    mutation.mutate(payload);
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
    <div className="max-w-7xl mx-auto space-y-10 pb-32">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full -mr-32 -mt-32 opacity-20 blur-3xl group-hover:bg-brand-100 transition-colors" />
        <div className="flex items-center gap-6 relative">
          <button 
            onClick={() => navigate("/rooms")} 
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
              {isEdit ? `Unit ${room?.room_number}` : "New Asset"} <span className="text-brand-600">Sync</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">
              {isEdit ? "Optimizing architectural parameters" : "Initializing core unit registry"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Gallery Sidebar - Shifted to left/top and made compact */}
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
          {isEdit ? (
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera size={16} className="text-slate-400" />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Asset Archive</h3>
                </div>
                <span className="text-[10px] bg-brand-50 text-brand-600 px-3 py-1 rounded-xl font-black">{room?.photos?.length || 0} TOTAL</span>
              </div>

              {/* Grid of photos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {room?.photos?.map((p) => (
                  <div key={p.id} className="relative group rounded-3xl overflow-hidden aspect-[16/10] bg-slate-50 border border-slate-100">
                    <img src={p.cloudinary_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {p.is_primary && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-brand-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                          <CheckCircle2 size={10} /> Cover
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white hover:bg-red-500 rounded-2xl w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}

                {/* Upload Interface */}
                <div className="pt-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="room-photo"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    className="hidden"
                  />
                  <label 
                    htmlFor="room-photo"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[2.5rem] p-10 hover:border-brand-500 hover:bg-brand-50/30 transition-all cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                      <Camera size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center group-hover:text-brand-600 max-w-[120px]">
                      {photoFile ? photoFile.name : "Integrate Visual Data"}
                    </p>
                  </label>
                  
                  {photoFile && (
                    <button
                      onClick={handlePhotoUpload}
                      disabled={photoUploading}
                      className="w-full mt-4 py-4 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-600 shadow-xl shadow-slate-200 transition-all disabled:opacity-50"
                    >
                      {photoUploading ? "Synchronizing..." : "Initiate Upload"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-all" />
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl mb-8">
                ⚡
              </div>
              <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">Registration Mode</h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed mt-4">
                Initializing asset registry. Visual data streams can be linked post-synchronization.
              </p>
              <div className="pt-10 space-y-4">
                {[
                  "Real-time Inventory Link",
                  "Dynamic Pricing Model",
                  "Global Distribution Sync"
                ].map(text => (
                  <div key={text} className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500" /> {text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Form Area */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 rounded-bl-[5rem] -mr-20 -mt-20 opacity-40 -z-0" />
            
            <section className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200">
                  <Layout size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Core Identity</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Physical Unit Parameters</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Room ID *
                  </label>
                  <input required value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    className="w-full bg-slate-50 border-transparent rounded-[1.5rem] px-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="e.g. 101" />
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Floor Level *
                  </label>
                  <input required type="number" min={1} value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} 
                    className="w-full bg-slate-50 border-transparent rounded-[1.5rem] px-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all outline-none" />
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Classification *
                  </label>
                  <select required value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}
                    className="w-full bg-slate-50 border-transparent rounded-[1.5rem] px-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all appearance-none cursor-pointer outline-none">
                    {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Bed Configuration *
                  </label>
                  <input required value={form.bed_config} onChange={(e) => setForm({ ...form, bed_config: e.target.value })}
                    className="w-full bg-slate-50 border-transparent rounded-[1.5rem] px-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="e.g. 1 King Bed" />
                </div>
              </div>
            </section>

            <section className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-xl shadow-brand-100">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Commercial Strategy</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pricing & Status Controls</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Nightly Base Rate (₹) *
                  </label>
                  <div className="relative group">
                    <span className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 font-black group-focus-within:text-brand-500 transition-colors">₹</span>
                    <input required type="number" min={0} value={form.base_price}
                      onChange={(e) => setForm({ ...form, base_price: e.target.value })} 
                      className="w-full bg-slate-50 border-transparent rounded-[1.5rem] pl-12 pr-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="2500" />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Operational Status *
                  </label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} 
                    className="w-full bg-slate-50 border-transparent rounded-[1.5rem] px-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all appearance-none cursor-pointer outline-none">
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Value Additions</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Guest Experience Markers</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div 
                    onClick={() => setForm(f => ({ ...f, extra_bed: !f.extra_bed }))}
                    className={`flex items-center gap-5 p-7 rounded-[2rem] border transition-all cursor-pointer ${
                      form.extra_bed ? 'bg-brand-50 border-brand-200' : 'bg-slate-50 border-transparent border-dotted border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      form.extra_bed ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-400'
                    }`}>
                      <Bed size={18} />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Extra Provision</label>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Additional capacity</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                      Physical Location
                    </label>
                    <input
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-slate-50 border-transparent rounded-[1.5rem] px-7 py-5 text-slate-900 font-black focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all outline-none"
                      placeholder="e.g. Wing A"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Asset Narrative
                  </label>
                  <textarea rows={4} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-50 border-transparent rounded-[2rem] px-8 py-6 text-slate-900 font-bold focus:ring-4 focus:ring-brand-500/5 focus:bg-white focus:border-brand-500 transition-all resize-none outline-none leading-relaxed" 
                    placeholder="Elaborate on the unit's unique spatial atmosphere..." />
                </div>

                {amenities.length > 0 && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technical Amenities</label>
                    <div className="flex flex-wrap gap-3">
                      {amenities.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => toggleAmenity(a.id)}
                          className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            form.amenity_ids.includes(a.id)
                              ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200"
                              : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                          }`}
                        >
                          {a.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <div className="pt-10 flex items-center justify-between border-t border-slate-50">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Registry v1.0.4 - All changes logged</span>
              <div className="flex gap-4">
                <button type="button" onClick={() => navigate("/rooms")} 
                  className="px-8 py-4 rounded-2xl text-[10px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit" disabled={mutation.isPending} 
                  className="px-10 py-4 rounded-2xl text-[10px] font-black text-white bg-brand-600 hover:bg-brand-700 shadow-xl shadow-brand-100 transition-all disabled:opacity-50">
                  {mutation.isPending ? "Syncing..." : isEdit ? "Update System" : "Integrate Asset"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
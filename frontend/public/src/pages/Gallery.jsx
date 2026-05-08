import { useQuery } from "@tanstack/react-query";
import { getRooms } from "../api/rooms";
import Spinner from "../components/ui/Spinner";

export default function Gallery() {
  const { data, isLoading } = useQuery({
    queryKey: ["rooms-gallery"],
    queryFn: () => getRooms({}),
  });

  const rooms = data?.results || [];
  const photos = rooms.flatMap((r) =>
    (r.primary_photo ? [{ url: r.primary_photo, room: `Room ${r.room_number} — ${r.room_type}` }] : [])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="section-title">Photo Gallery</h1>
          <p className="section-subtitle">A glimpse of your upcoming stay</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <Spinner className="py-24" />
        ) : photos.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {photos.map((p, i) => (
              <div key={i} className="break-inside-avoid rounded-2xl overflow-hidden shadow-sm group">
                <div className="relative">
                  <img
                    src={p.url}
                    alt={p.room}
                    className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">{p.room}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-gray-400">
            <div className="text-5xl mb-4">📷</div>
            <p className="text-lg">No photos yet.</p>
            <p className="text-sm mt-1">Photos will appear once rooms are added.</p>
          </div>
        )}
      </div>
    </div>
  );
}
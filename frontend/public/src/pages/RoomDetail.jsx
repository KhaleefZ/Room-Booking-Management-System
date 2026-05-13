import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRoom } from "../api/rooms";
import AvailabilityCalendar from "../components/ui/AvailabilityCalendar";
import Spinner from "../components/ui/Spinner";
import useBookingStore from "../store/bookingStore";
import { differenceInDays, format } from "date-fns";
import toast from "react-hot-toast";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setRoom, setDates, setStep } = useBookingStore();

  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [photoIdx, setPhotoIdx] = useState(0);

  const { data: room, isLoading, isError } = useQuery({
    queryKey: ["room", id],
    queryFn: () => getRoom(id),
  });

  const handleRangeSelect = (start, end) => {
    setCheckIn(start);
    setCheckOut(end);
  };

  useEffect(() => {
    setPhotoIdx(0);
  }, [room?.id]);

  const handleBook = () => {
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates.");
      return;
    }
    const nights = differenceInDays(checkOut, checkIn);
    if (nights < 1) {
      toast.error("Check-out must be after check-in.");
      return;
    }
    setRoom(room);
    setDates(
      format(checkIn, "yyyy-MM-dd"),
      format(checkOut, "yyyy-MM-dd"),
      nights
    );
    setStep(2);
    navigate("/book");
  };

  if (isLoading) return <Spinner className="py-32" />;
  if (isError) return (
    <div className="text-center py-32 text-gray-400">
      <p className="text-lg">Room not found.</p>
    </div>
  );

  const photos = [...(room.photos || [])].sort((left, right) => {
    if (left.is_primary === right.is_primary) {
      return (left.order ?? 0) - (right.order ?? 0);
    }
    return left.is_primary ? -1 : 1;
  });
  const displayPhoto = photos[photoIdx]?.cloudinary_url;
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — Photos + Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main photo */}
            <div className="bg-gray-100 rounded-2xl overflow-hidden h-80 md:h-96">
              {displayPhoto ? (
                <img src={displayPhoto} alt="Room" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">🏨</div>
              )}
            </div>

            {/* Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => setPhotoIdx(i)}
                    className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === photoIdx ? "border-brand-600" : "border-transparent"
                    }`}
                  >
                    <img src={p.cloudinary_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Room info */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="font-serif text-3xl font-bold text-gray-900">
                    Room {room.room_number}
                  </h1>
                  <p className="text-brand-600 font-semibold mt-1">{room.room_type} Room</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{Number(room.base_price).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">per night</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span>🛏 {room.bed_config}</span>
                <span>👥 Up to {room.capacity} guests</span>
                <span>🏢 Floor {room.floor}</span>
                <span className={`font-medium ${room.status === "Available" ? "text-green-600" : "text-red-500"}`}>
                  ● {room.status}
                </span>
              </div>

              {room.description && (
                <p className="text-gray-600 leading-relaxed">{room.description}</p>
              )}

              {room.amenities?.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {room.amenities.map((a) => (
                      <span key={a.id} className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm">
                        {a.icon} {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Booking panel */}
          <div className="space-y-4">
            <div className="card p-5 sticky top-20">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">Select Dates</h2>

              <AvailabilityCalendar
                roomId={room.id}
                onRangeSelect={handleRangeSelect}
                selectedCheckIn={checkIn ? format(checkIn, "yyyy-MM-dd") : null}
                selectedCheckOut={checkOut ? format(checkOut, "yyyy-MM-dd") : null}
              />

              {checkIn && checkOut && nights > 0 && (
                <div className="mt-4 p-3 bg-brand-50 rounded-lg text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Check-in</span>
                    <span className="font-medium">{format(checkIn, "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 mt-1">
                    <span>Check-out</span>
                    <span className="font-medium">{format(checkOut, "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t border-brand-100">
                    <span>{nights} night{nights > 1 ? "s" : ""}</span>
                    <span>₹{(Number(room.base_price) * nights).toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={room.status !== "Available"}
                className="btn-primary w-full mt-4"
              >
                {room.status === "Available" ? "Continue to Book" : "Room Unavailable"}
              </button>

              <p className="text-xs text-center text-gray-400 mt-3">
                No payment charged yet — review first
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
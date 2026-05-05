import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRoomAvailability } from "../../api/rooms";
import { format, startOfMonth, endOfMonth, eachDayOfInterval,
         isSameMonth, isSameDay, isToday, isBefore, startOfDay } from "date-fns";

export default function AvailabilityCalendar({ roomId, onRangeSelect, selectedCheckIn, selectedCheckOut }) {
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(new Date());

  const { data } = useQuery({
    queryKey: ["availability", roomId, viewDate.getFullYear(), viewDate.getMonth() + 1],
    queryFn: () => getRoomAvailability(roomId, viewDate.getFullYear(), viewDate.getMonth() + 1),
    enabled: !!roomId,
  });

  const unavailable = new Set(data?.unavailable_dates || []);
  const days = eachDayOfInterval({ start: startOfMonth(viewDate), end: endOfMonth(viewDate) });
  const startPad = startOfMonth(viewDate).getDay();

  const isUnavailable = (d) => unavailable.has(format(d, "yyyy-MM-dd"));
  const isPast = (d) => isBefore(d, today);
  const isSelected = (d) =>
    (selectedCheckIn && isSameDay(d, new Date(selectedCheckIn))) ||
    (selectedCheckOut && isSameDay(d, new Date(selectedCheckOut)));
  const isInRange = (d) => {
    if (!selectedCheckIn || !selectedCheckOut) return false;
    return d > new Date(selectedCheckIn) && d < new Date(selectedCheckOut);
  };

  const [hoverDate, setHoverDate] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [tempStart, setTempStart] = useState(null);

  const handleDayClick = (d) => {
    if (isPast(d) || isUnavailable(d)) return;
    if (!selecting || !tempStart) {
      setSelecting(true);
      setTempStart(d);
    } else {
      if (d <= tempStart) {
        setTempStart(d);
        return;
      }
      onRangeSelect(tempStart, d);
      setSelecting(false);
      setTempStart(null);
    }
  };

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-gray-900">{format(viewDate, "MMMM yyyy")}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
        {days.map((d) => {
          const unav = isUnavailable(d);
          const past = isPast(d);
          const sel = isSelected(d);
          const inRange = isInRange(d);
          const disabled = unav || past;

          return (
            <button
              key={d.toISOString()}
              onClick={() => handleDayClick(d)}
              onMouseEnter={() => setHoverDate(d)}
              onMouseLeave={() => setHoverDate(null)}
              disabled={disabled}
              className={`
                h-9 w-full rounded-lg text-xs font-medium transition-colors
                ${disabled ? "text-gray-300 cursor-not-allowed line-through" : "cursor-pointer"}
                ${sel ? "bg-brand-600 text-white" : ""}
                ${inRange ? "bg-brand-100 text-brand-700" : ""}
                ${!disabled && !sel && !inRange ? "hover:bg-brand-50 text-gray-700" : ""}
                ${isToday(d) && !sel ? "ring-1 ring-brand-400" : ""}
              `}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-brand-600 inline-block" /> Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-200 inline-block line-through" /> Unavailable
        </span>
      </div>

      {selecting && (
        <p className="mt-3 text-xs text-brand-600 font-medium">
          ✓ Check-in selected. Now click your check-out date.
        </p>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRooms } from "../../api/rooms";
import { getPublicSettings } from "../../api/settings";
import { createInvoice, updateInvoice, getInvoice, downloadManualInvoice } from "../../api/invoices";
import Spinner from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import { format, addDays } from "date-fns";

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    invoice_number: "01",
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    guest_address: "",
    guest_gst_number: "",
    check_in: format(new Date(), "yyyy-MM-dd"),
    check_out: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    selected_room_ids: [],
    discount_amount: 0,
    description: "",
  });

  // Specifications/extra configs per room: { [roomId]: { utilities, extra_guest_count, extra_guest_charge, total_guest_count } }
  const [roomConfigs, setRoomConfigs] = useState({});

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ["rooms-all"],
    queryFn: () => getRooms({ page_size: 100 }),
  });

  const { data: invoiceData, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice-detail", id],
    queryFn: () => getInvoice(id),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && invoiceData) {
      const breakdown = invoiceData.breakdown || [];
      const selectedRoomIds = breakdown.map(item => String(item.room_id));
      const configs = {};
      breakdown.forEach(item => {
        configs[String(item.room_id)] = {
          utilities: item.utilities || 0,
          extra_guest_count: item.extra_guest_count || 0,
          extra_guest_charge: item.extra_guest_charge || 500,
          total_guest_count: item.total_guest_count || 1,
        };
      });

      setForm({
        invoice_number: invoiceData.invoice_number || "",
        guest_name: invoiceData.guest_name || "",
        guest_email: invoiceData.guest_email || "",
        guest_phone: invoiceData.guest_phone || "",
        guest_address: invoiceData.guest_address || "",
        guest_gst_number: invoiceData.guest_gst_number || "",
        check_in: invoiceData.check_in || "",
        check_out: invoiceData.check_out || "",
        selected_room_ids: selectedRoomIds,
        discount_amount: Number(invoiceData.discount_amount) || 0,
        description: invoiceData.description || "",
      });
      setRoomConfigs(configs);
    }
  }, [isEdit, invoiceData]);

  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: getPublicSettings,
  });

  const rooms = roomsData?.results || [];
  const taxRate = settings?.tax_rate ? Number(settings.tax_rate) : 18;

  // Selected room objects
  const selectedRoomsList = rooms.filter((r) =>
    form.selected_room_ids.includes(String(r.id))
  );

  // Synchronize roomConfigs when selected rooms change
  useEffect(() => {
    setRoomConfigs((prev) => {
      const updated = { ...prev };
      form.selected_room_ids.forEach((id) => {
        if (!updated[id]) {
          updated[id] = {
            utilities: 0,
            extra_guest_count: 0,
            extra_guest_charge: 500,
            total_guest_count: 1,
          };
        }
      });
      // Clean up deselected rooms
      Object.keys(updated).forEach((id) => {
        if (!form.selected_room_ids.includes(id)) {
          delete updated[id];
        }
      });
      return updated;
    });
  }, [form.selected_room_ids]);

  // Calculations
  const checkInDate = new Date(form.check_in);
  const checkOutDate = new Date(form.check_out);
  const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))) || 1;
  const roomCount = selectedRoomsList.length;

  // Compute breakdown list for each room
  const breakdownList = selectedRoomsList.map((room) => {
    const config = roomConfigs[String(room.id)] || {
      utilities: 0,
      extra_guest_count: 0,
      extra_guest_charge: 500,
      total_guest_count: 1,
    };
    const roomBaseTotal = Number(room.base_price) * nights;
    const extraGuestTotal = Number(config.extra_guest_count) * Number(config.extra_guest_charge) * nights;
    const roomTotal = roomBaseTotal + Number(config.utilities) + extraGuestTotal;

    return {
      room_id: room.id,
      room_number: room.room_number,
      room_type: room.room_type,
      base_price: Number(room.base_price),
      nights: nights,
      room_base_total: roomBaseTotal,
      utilities: Number(config.utilities),
      extra_guest_count: Number(config.extra_guest_count),
      extra_guest_charge: Number(config.extra_guest_charge),
      extra_guest_total: extraGuestTotal,
      total_guest_count: Number(config.total_guest_count),
      total: roomTotal,
    };
  });

  const baseAmount = breakdownList.reduce((acc, item) => acc + item.total, 0);
  const taxAmount = Number((baseAmount * (taxRate / 100)).toFixed(2));
  const totalAmount = Number((baseAmount + taxAmount - Number(form.discount_amount)).toFixed(2));

  // Auto-fill Description details when rooms or selections change
  const handleAutoFillDescription = () => {
    if (selectedRoomsList.length === 0) {
      toast.error("Please select at least one room first.");
      return;
    }
    
    let desc = `Stay breakdown for ${nights} night(s) (${roomCount} room(s)):\n`;
    breakdownList.forEach((item) => {
      desc += `- Room ${item.room_number} (${item.room_type}): base ₹${item.room_base_total}`;
      if (item.extra_guest_count > 0) {
        desc += `, extra guests (${item.extra_guest_count}) ₹${item.extra_guest_total}`;
      }
      if (item.utilities > 0) {
        desc += `, utilities ₹${item.utilities}`;
      }
      desc += ` (Room Total: ₹${item.total})\n`;
    });
    
    setForm((prev) => ({ ...prev, description: desc }));
    toast.success("Description details auto-filled!");
  };

  const handleRoomToggle = (roomId) => {
    setForm((prev) => {
      const exists = prev.selected_room_ids.includes(String(roomId));
      const updated = exists
        ? prev.selected_room_ids.filter((id) => id !== String(roomId))
        : [...prev.selected_room_ids, String(roomId)];
      return { ...prev, selected_room_ids: updated };
    });
  };

  const mutation = useMutation({
    mutationFn: (payload) => isEdit ? updateInvoice(id, payload) : createInvoice(payload),
    onSuccess: (data) => {
      toast.success(isEdit ? "Invoice updated successfully!" : "Manual invoice saved successfully!");
      qc.invalidateQueries(["invoices-list"]);
      if (isEdit) {
        qc.invalidateQueries(["invoice-detail", id]);
      }
      
      // Auto-trigger invoice download
      toast.promise(downloadManualInvoice(data.id), {
        loading: 'Compiling PDF document...',
        success: 'Invoice PDF Downloaded!',
        error: 'Failed to compile invoice PDF'
      });
      
      navigate("/invoices");
    },
    onError: (err) => {
      const errorData = err.response?.data;
      if (typeof errorData === "object" && errorData !== null) {
        Object.keys(errorData).forEach((key) => {
          toast.error(`${key}: ${errorData[key]}`);
        });
      } else {
        toast.error(isEdit ? "Failed to update invoice. Check inputs." : "Failed to create manual invoice. Check inputs.");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRoomsList.length === 0) {
      toast.error("Please select at least one room.");
      return;
    }
    if (!form.invoice_number.trim()) {
      toast.error("Please provide a valid Invoice Number.");
      return;
    }

    const roomDetailsStr = selectedRoomsList
      .map((r) => `Room ${r.room_number} (${r.room_type})`)
      .join(", ");

    const payload = {
      invoice_number: form.invoice_number,
      guest_name: form.guest_name,
      guest_email: form.guest_email,
      guest_phone: form.guest_phone,
      guest_address: form.guest_address,
      guest_gst_number: form.guest_gst_number || null,
      room_details: roomDetailsStr,
      room_count: roomCount,
      check_in: form.check_in,
      check_out: form.check_out,
      nights: nights,
      base_amount: baseAmount,
      tax_amount: taxAmount,
      discount_amount: Number(form.discount_amount),
      total_amount: totalAmount,
      description: form.description,
      breakdown: breakdownList,
    };

    mutation.mutate(payload);
  };

  const pageLoading = roomsLoading || (isEdit && invoiceLoading);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 rounded-full -mr-16 -mt-16 opacity-10 blur-xl" />
          <h1 className="text-2xl font-black uppercase tracking-tight">
            {isEdit ? "Edit Manual Invoice" : "Manual Invoice Generator"}
          </h1>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Billing Operations Terminal</p>
        </div>

        {pageLoading ? (
          <Spinner className="py-20" />
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Invoice Configuration */}
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Document Settings</h2>
              <div className="w-full md:w-1/2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Invoice Number</label>
                <input
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                  placeholder="e.g. 01"
                  required
                />
                <p className="text-[10px] text-slate-400">Specify invoice number (e.g. 01, 02, or custom INV-01)</p>
              </div>
            </div>

            {/* Billing Information */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Billing Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Name</label>
                  <input
                    type="text"
                    value={form.guest_name}
                    onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Enter customer full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Email</label>
                  <input
                    type="email"
                    value={form.guest_email}
                    onChange={(e) => setForm({ ...form, guest_email: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="customer@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Phone</label>
                  <input
                    type="text"
                    value={form.guest_phone}
                    onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer GSTIN (Optional)</label>
                  <input
                    type="text"
                    value={form.guest_gst_number}
                    onChange={(e) => setForm({ ...form, guest_gst_number: e.target.value.toUpperCase() })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="e.g. 33ACYPT6253G1Z0"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Address</label>
                  <textarea
                    value={form.guest_address}
                    onChange={(e) => setForm({ ...form, guest_address: e.target.value })}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Complete billing address"
                  />
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Stay Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Check-in Date</label>
                  <input
                    type="date"
                    value={form.check_in}
                    onChange={(e) => setForm({ ...form, check_in: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Check-out Date</label>
                  <input
                    type="date"
                    value={form.check_out}
                    min={form.check_in}
                    onChange={(e) => setForm({ ...form, check_out: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Stay Duration</label>
                  <input
                    type="text"
                    value={`${nights} Night(s)`}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Room Count</label>
                  <input
                    type="text"
                    value={`${roomCount} Room(s) Selected`}
                    disabled
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Room Selection */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Select Rooms (Updates Price & GST Live)</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {rooms.map((room) => {
                  const isSelected = form.selected_room_ids.includes(String(room.id));
                  return (
                    <div
                      key={room.id}
                      onClick={() => handleRoomToggle(room.id)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all select-none flex flex-col justify-between h-24 ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-md"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-sm font-bold">Room {room.room_number}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {room.room_type}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <span className="text-[10px] opacity-65">Base Price</span>
                        <span className="text-sm font-black">₹{Number(room.base_price).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Room Specifications & Extras */}
            <div className="space-y-6">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Room Specifications & Extras</h2>
              
              {selectedRoomsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Please select one or more rooms above to configure specifications.</p>
              ) : (
                <div className="space-y-4">
                  {selectedRoomsList.map((room) => {
                    const config = roomConfigs[String(room.id)] || {
                      utilities: 0,
                      extra_guest_count: 0,
                      extra_guest_charge: 500,
                      total_guest_count: 1,
                    };
                    
                    const handleConfigChange = (field, value) => {
                      setRoomConfigs((prev) => ({
                        ...prev,
                        [room.id]: {
                          ...prev[room.id],
                          [field]: value,
                        },
                      }));
                    };

                    return (
                      <div key={room.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Room {room.room_number} — {room.room_type}
                          </h3>
                          <span className="text-xs font-bold text-slate-500">
                            Base: ₹{room.base_price}/night
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Utilities Amount (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={config.utilities}
                              onChange={(e) => handleConfigChange("utilities", Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Extra Guest Count</label>
                            <input
                              type="number"
                              min="0"
                              value={config.extra_guest_count}
                              onChange={(e) => handleConfigChange("extra_guest_count", Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Extra Guest Charge (₹)</label>
                            <input
                              type="number"
                              min="0"
                              value={config.extra_guest_charge}
                              onChange={(e) => handleConfigChange("extra_guest_charge", Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Guest Count</label>
                            <input
                              type="number"
                              min="1"
                              value={config.total_guest_count}
                              onChange={(e) => handleConfigChange("total_guest_count", Number(e.target.value))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discount and General Description */}
              <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="w-full sm:w-1/3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.discount_amount}
                    onChange={(e) => setForm({ ...form, discount_amount: Number(e.target.value) })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Additional Remarks / Details</label>
                    <button
                      type="button"
                      onClick={handleAutoFillDescription}
                      className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      ⚡ Auto-fill breakdown text
                    </button>
                  </div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="Provide any utilities details, room names and numbers, extra guest counts, etc."
                  />
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50/50 p-8 rounded-[1.5rem] border border-slate-100 space-y-4">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Billing Breakdown</h2>
              
              {breakdownList.map((item) => (
                <div key={item.room_id} className="text-xs space-y-1 pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex justify-between font-bold text-slate-700">
                    <span>Room {item.room_number} ({item.room_type}) Subtotal</span>
                    <span>₹{item.total.toLocaleString()}</span>
                  </div>
                  <div className="pl-4 text-slate-500 space-y-0.5">
                    <div className="flex justify-between">
                      <span>Stay: {item.nights} Night(s) @ ₹{item.base_price}/night</span>
                      <span>₹{item.room_base_total.toLocaleString()}</span>
                    </div>
                    {item.extra_guest_count > 0 && (
                      <div className="flex justify-between">
                        <span>Extra Guests: {item.extra_guest_count} Guest(s) x {item.nights} Night(s)</span>
                        <span>₹{item.extra_guest_total.toLocaleString()}</span>
                      </div>
                    )}
                    {item.utilities > 0 && (
                      <div className="flex justify-between">
                        <span>Utilities</span>
                        <span>₹{item.utilities.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between text-sm text-slate-800 font-bold border-t border-slate-200 pt-3">
                <span>Taxable Base Amount</span>
                <span>₹{baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>GST ({taxRate}%)</span>
                <span>₹{taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {Number(form.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span className="font-bold">- ₹{Number(form.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-black text-slate-900 border-t-2 border-slate-300 pt-3">
                <span className="uppercase tracking-tight">Grand Total</span>
                <span>₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-100 flex gap-4">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mutation.isPending 
                  ? (isEdit ? "Updating Invoice..." : "Generating Invoice...") 
                  : (isEdit ? "Update & Download Invoice" : "Save & Download Invoice")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/invoices")}
                className="px-8 py-4 border border-slate-200 rounded-xl text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}

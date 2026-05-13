import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGuest, createGuest, updateGuest } from "../../api/guests";
import toast from "react-hot-toast";

const ID_TYPES = [
  { value: "Aadhaar", label: "Aadhaar" },
  { value: "PAN", label: "PAN" },
  { value: "Passport", label: "Passport" },
  { value: "DrivingLicense", label: "Driving License" },
];

export default function GuestForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "+91",
    id_type: "Aadhaar",
    id_number: "",
    address: "",
    special_requests: "",
  });

  const { isLoading } = useQuery({
    queryKey: ["guest", id],
    queryFn: () => getGuest(id),
    enabled: isEdit,
    onSuccess: (data) => setForm(data),
  });

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? updateGuest(id, data) : createGuest(data)),
    onSuccess: () => {
      toast.success(isEdit ? "Guest updated!" : "Guest created!");
      qc.invalidateQueries(["guests-list"]);
      navigate("/guests");
    },
    onError: (err) => {
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        Object.entries(errorData).forEach(([key, val]) => {
          toast.error(`${key}: ${val}`);
        });
      } else {
        toast.error("An error occurred. Please try again.");
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  if (isLoading) return <div className="p-10 text-center">Loading Guest Data...</div>;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 p-6 text-white">
          <h1 className="text-xl font-bold">{isEdit ? "Edit Guest Profile" : "Register New Guest"}</h1>
          <p className="text-gray-400 text-sm">Ensure all identity details match the government records.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-field w-full"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field w-full"
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Phone Number</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field w-full"
                placeholder="+919876543210"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">ID Type</label>
              <select
                value={form.id_type}
                onChange={(e) => setForm({ ...form, id_type: e.target.value })}
                className="input-field w-full"
              >
                {ID_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">ID Number</label>
              <input
                type="text"
                required
                value={form.id_number}
                onChange={(e) => setForm({ ...form, id_number: e.target.value })}
                className="input-field w-full"
                placeholder="Enter ID number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Residential Address</label>
            <textarea
              required
              rows={3}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field w-full"
              placeholder="Full street address, city, state, zip"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Special Instructions / Notes</label>
            <textarea
              rows={2}
              value={form.special_requests}
              onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
              className="input-field w-full"
              placeholder="Any medical conditions or preferences..."
            />
          </div>

          <div className="pt-6 border-t border-gray-50 flex gap-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-100"
            >
              {mutation.isPending ? "Saving Records..." : isEdit ? "Update Portfolio" : "Complete Registration"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/guests")}
              className="px-8 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

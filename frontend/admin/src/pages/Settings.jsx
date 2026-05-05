import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings, updateSettings } from "../api/settings";
import Spinner from "../components/ui/Spinner";
import toast from "react-hot-toast";

export default function Settings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["hotel-settings"],
    queryFn: getSettings,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => { toast.success("Settings saved!"); qc.invalidateQueries(["hotel-settings"]); },
    onError: () => toast.error("Failed to save settings."),
  });

  if (isLoading || !form) return <Spinner className="py-16" />;

  const Field = ({ label, name, type = "text", hint }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="input-field"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* General */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">General</h3>
        <Field label="Hotel Name" name="hotel_name" />
        <Field label="Admin Email Address" name="admin_email_address" type="email"
          hint="New booking notifications are sent here." />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Check-in Time" name="check_in_time" type="time" />
          <Field label="Check-out Time" name="check_out_time" type="time" />
        </div>
        <Field label="Tax Rate (%)" name="tax_rate" type="number"
          hint="Applied to all bookings. Default is 18% GST." />
      </div>

      {/* Cancellation policy */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Cancellation Policy</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Policy Text</label>
          <textarea
            rows={3}
            value={form.cancellation_policy || ""}
            onChange={(e) => setForm({ ...form, cancellation_policy: e.target.value })}
            className="input-field resize-none"
          />
        </div>
      </div>

      {/* Email templates */}
      <div className="card p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">Email Templates</h3>
        <p className="text-xs text-gray-400">
          Available placeholders: {"{{guest_name}}"}, {"{{booking_reference}}"}, {"{{room_name}}"}, {"{{check_in}}"}, {"{{check_out}}"}, {"{{total_amount}}"}
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guest Confirmation Email</label>
          <textarea
            rows={6}
            value={form.guest_email_template || ""}
            onChange={(e) => setForm({ ...form, guest_email_template: e.target.value })}
            className="input-field resize-none font-mono text-xs"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notification Email</label>
          <textarea
            rows={6}
            value={form.admin_email_template || ""}
            onChange={(e) => setForm({ ...form, admin_email_template: e.target.value })}
            className="input-field resize-none font-mono text-xs"
          />
        </div>
      </div>

      <button
        onClick={() => mutation.mutate(form)}
        disabled={mutation.isPending}
        className="btn-primary w-full py-3"
      >
        {mutation.isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
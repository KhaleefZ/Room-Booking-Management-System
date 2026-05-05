import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPromos, createPromo, updatePromo, deletePromo } from "../api/promos";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Spinner from "../components/ui/Spinner";
import toast from "react-hot-toast";

const EMPTY = {
  code: "", discount_type: "percent", discount_value: "",
  expiry_date: "", usage_limit: 100, is_active: true,
};

export default function Promos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["promos"],
    queryFn: getPromos,
  });

  const promos = data?.results || [];

  const createMutation = useMutation({
    mutationFn: createPromo,
    onSuccess: () => { toast.success("Promo created!"); qc.invalidateQueries(["promos"]); setShowForm(false); setForm(EMPTY); },
    onError: () => toast.error("Failed to create promo."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => updatePromo(id, { is_active }),
    onSuccess: () => { toast.success("Updated!"); qc.invalidateQueries(["promos"]); },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePromo,
    onSuccess: () => { toast.success("Deleted!"); qc.invalidateQueries(["promos"]); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary">+ New Promo Code</button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <Spinner className="py-16" /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-th">Code</th>
                  <th className="table-th">Type</th>
                  <th className="table-th">Value</th>
                  <th className="table-th">Expiry</th>
                  <th className="table-th">Used / Limit</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="table-td font-mono font-semibold">{p.code}</td>
                    <td className="table-td capitalize">{p.discount_type}</td>
                    <td className="table-td">
                      {p.discount_type === "percent" ? `${p.discount_value}%` : `₹${p.discount_value}`}
                    </td>
                    <td className="table-td">{p.expiry_date}</td>
                    <td className="table-td">{p.times_used} / {p.usage_limit}</td>
                    <td className="table-td">
                      <span className={p.is_active ? "badge-green" : "badge-gray"}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleMutation.mutate({ id: p.id, is_active: !p.is_active })}
                          className="btn-secondary py-1 px-3"
                        >
                          {p.is_active ? "Disable" : "Enable"}
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="btn-danger py-1 px-3">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && (
                  <tr><td colSpan={7} className="table-td text-center text-gray-400 py-12">No promo codes yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Promo Code">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="input-field" placeholder="e.g. SUMMER20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input-field">
                <option value="percent">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <input type="number" value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                className="input-field" placeholder={form.discount_type === "percent" ? "e.g. 10" : "e.g. 500"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
              <input type="date" value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input type="number" value={form.usage_limit}
                onChange={(e) => setForm({ ...form, usage_limit: Number(e.target.value) })} className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 pt-2 justify-end">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Promo Code"
        message="Are you sure you want to delete this promo code?"
      />
    </div>
  );
}
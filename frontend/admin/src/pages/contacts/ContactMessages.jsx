import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContactMessages, updateContactMessage, deleteContactMessage } from "../../api/contacts";
import Spinner from "../../components/ui/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function ContactMessages() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["contact-messages", search],
    queryFn: () => getContactMessages({ ...(search && { search }) }),
  });

  const messages = data?.results || data || [];

  const markAsReadMutation = useMutation({
    mutationFn: ({ id, is_read }) => updateContactMessage(id, { is_read }),
    onSuccess: () => {
      queryClient.invalidateQueries(["contact-messages"]);
      toast.success("Status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteContactMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["contact-messages"]);
      toast.success("Message deleted");
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Contact Messages</h1>
          <p className="text-sm text-gray-400 font-medium">Inquiries from the website</p>
        </div>
        <div className="flex gap-2">
           <span className="text-xs font-bold bg-brand-50 text-brand-600 px-4 py-2 rounded-full h-fit self-center">
            {messages.length} TOTAL MESSAGES
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by name, email or message content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full bg-white shadow-sm border-none"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {messages.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-gray-300">
            <p className="text-gray-400 font-medium">No messages found.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`bg-white p-6 rounded-2xl shadow-sm border ${msg.is_read ? 'border-gray-100 opacity-75' : 'border-brand-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{msg.name}</h3>
                  <p className="text-xs text-gray-500">{msg.email} • {msg.phone || 'No phone'}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">{format(new Date(msg.created_at), "PPP p")}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => markAsReadMutation.mutate({ id: msg.id, is_read: !msg.is_read })}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-lg ${msg.is_read ? 'bg-gray-100 text-gray-500' : 'bg-brand-50 text-brand-600'}`}
                  >
                    {msg.is_read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button
                    onClick={() => { if(window.confirm('Delete this message?')) deleteMutation.mutate(msg.id) }}
                    className="px-3 py-1 text-[10px] font-black uppercase tracking-tighter bg-red-50 text-red-600 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 whitespace-pre-wrap italic">
                "{msg.message}"
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Mail, Search, UserX, Send, BookOpen } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminNewsletter() {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sendForm, setSendForm] = useState({ subject: "", body: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiGet('/api/v1/newsletter', { active: 'true', limit: 200, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => setSubscribers(res.data || []))
      .catch((err) => toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare gli iscritti" }))
      .finally(() => setLoading(false));
  }, []);

  const unsubscribe = async (email) => {
    try {
      await apiPost(`/api/v1/newsletter/unsubscribe/${email}`, {});
      setSubscribers(prev => prev.filter(s => s.email !== email));
      toast({ title: "Successo", description: "Iscritto rimosso" });
    } catch (err) {
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore nell'eliminazione" });
    }
  };

  const sendNewsletter = async (e) => {
    e.preventDefault();
    if (!sendForm.subject.trim() || !sendForm.body.trim()) {
      toast({ variant: "destructive", title: "Errore", description: "Oggetto e corpo sono obbligatori" });
      return;
    }
    setSending(true);

    try {
      await apiPost('/api/v1/admin/newsletter/send', {
        subject: sendForm.subject,
        body: sendForm.body,
      });
      toast({ title: "Successo", description: "Newsletter inviata" });
      setSendForm({ subject: "", body: "" });
    } catch (err) {
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore nell'invio" });
    } finally {
      setSending(false);
    }
  };

  const filtered = subscribers.filter(s =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
  );

  const active = subscribers.filter(s => s.active).length;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Newsletter</h2>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD0] text-center">
          <p className="text-4xl font-bold text-[#1C1C1C]">{subscribers.length}</p>
          <p className="font-sans text-xs text-[#999] mt-1">Totale iscritti</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD0] text-center">
          <p className="text-4xl font-bold text-green-600">{active}</p>
          <p className="font-sans text-xs text-[#999] mt-1">Iscritti attivi</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-[#E8DFD0] text-center">
          <p className="text-4xl font-bold text-[#999]">{subscribers.length - active}</p>
          <p className="font-sans text-xs text-[#999] mt-1">Disiscritti</p>
        </div>
      </div>

      {/* Send weekly poem */}
      <div className="bg-white rounded-2xl border border-[#E8DFD0] p-6 mb-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#C4956A]" /> Invia poesia settimanale</h3>
        <form onSubmit={sendNewsletter} className="flex flex-col gap-3">
          <input placeholder="Titolo poesia" value={sendForm.subject || ""} onChange={e => setSendForm({...sendForm, subject: e.target.value})} required className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
          <textarea placeholder="Testo poesia..." value={sendForm.body || ""} onChange={e => setSendForm({...sendForm, body: e.target.value})} required rows={5} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] resize-none" />
          <button type="submit" disabled={sending} className="self-start flex items-center gap-2 bg-[#C4956A] text-white px-6 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-[#B8845A] disabled:opacity-60">
            <Send className="w-4 h-4" />
            {sending ? `Invio a ${active} iscritti...` : `Invia poesia a ${active} iscritti`}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca email..." className="w-full pl-9 pr-4 py-2.5 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] bg-white" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Mail className="w-10 h-10 text-[#E8DFD0] mx-auto mb-3" />
            <p className="font-sans text-[#999]">Nessun iscritto</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0E9DE]">
            {filtered.map(sub => (
              <div key={sub.id} className="flex items-center gap-4 p-4">
                <Mail className="w-4 h-4 text-[#999] flex-shrink-0" />
                <p className="flex-1 font-sans text-sm">{sub.email}</p>
                <span className={`font-sans text-xs px-2 py-1 rounded-full ${sub.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {sub.active ? "Attivo" : "Disiscritto"}
                </span>
                {sub.active && (
                  <button onClick={() => unsubscribe(sub.email)} className="p-2 rounded-lg hover:bg-red-50 text-[#999] hover:text-red-500 transition-colors">
                    <UserX className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
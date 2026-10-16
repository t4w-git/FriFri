import { useState, useEffect } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Plus, Edit2, Trash2, X, Check, Upload, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const empty = { name: "", description: "", logoUrl: "", link: "", contactEmail: "", tier: "base", prizeDescription: "", gameType: "tutti", active: true };

export default function AdminSponsors() {
  const { toast } = useToast();
  const [sponsors, setSponsors] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => apiGet('/api/v1/sponsors', { limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })
    .then(res => setSponsors(res.data || []))
    .finally(() => setLoading(false));
  
  useEffect(() => { 
    load();
    // Load sponsor tiers from API
    apiGet('/api/v1/public/sponsor-tiers')
      .then(res => setTiers(Object.values(res)))
      .catch(() => setTiers([]));
  }, []);

  const save = async () => {
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "Errore", description: "Nome è obbligatorio" });
      return;
    }
    setSaving(true);
    try {
      // Convert null values to empty strings for optional URL fields
      const payload = {
        ...form,
        logoUrl: form.logoUrl || "",
        link: form.link || "",
        contactEmail: form.contactEmail || "",
        description: form.description || "",
        prizeDescription: form.prizeDescription || "",
      };
      
      if (editing === "new") {
        await apiPost('/api/v1/sponsors', payload);
        toast({ title: "Successo", description: "Sponsor creato" });
      } else {
        await apiPut(`/api/v1/sponsors/${editing}`, payload);
        toast({ title: "Successo", description: "Sponsor aggiornato" });
      }
      setEditing(null);
      load();
    } catch (err) {
      console.error('Save error:', err);
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore durante il salvataggio" });
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm("Eliminare sponsor?")) return;
    try {
      await apiDelete(`/api/v1/sponsors/${id}`);
      toast({ title: "Successo", description: "Sponsor eliminato" });
      load();
    } catch (err) {
      console.error('Delete error:', err);
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore durante l'eliminazione" });
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/v1/upload/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Errore nel caricamento');
      }
      
      const fullUrl = data.url.startsWith('http') ? data.url : `${data.url}`;
      setForm({...form, logoUrl: fullUrl});
      toast({ title: "Successo", description: "Logo caricato" });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore nel caricamento logo" });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async () => {
    if (!form.logoUrl) return;
    try {
      const filename = form.logoUrl.split('/').pop();
      await fetch(`/api/v1/upload/images/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setForm({...form, logoUrl: ""});
      toast({ title: "Successo", description: "Logo eliminato" });
    } catch (err) {
      console.error('Delete error:', err);
      toast({ variant: "destructive", title: "Errore", description: "Errore durante l'eliminazione" });
    }
  };

  const tierColors = { gold: "bg-yellow-100 text-yellow-700", premium: "bg-purple-100 text-purple-700", base: "bg-gray-100 text-gray-600" };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Sponsor ({sponsors.length})</h2>
        <button onClick={() => { setForm(empty); setEditing("new"); }} className="flex items-center gap-2 bg-[#C4956A] text-white px-5 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-[#B8845A]">
          <Plus className="w-4 h-4" /> Nuovo sponsor
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-5">{editing === "new" ? "Nuovo sponsor" : "Modifica sponsor"}</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input placeholder="Nome attività *" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
            <div className="bg-[#FDFCF8] p-3 rounded-xl border border-[#E8DFD0]">
              <label className="font-sans text-xs text-[#666] block mb-2 font-semibold">Logo</label>
              <div className="flex gap-2 mb-2">
                <input placeholder="URL logo" value={form.logoUrl || ""} onChange={e => setForm({...form, logoUrl: e.target.value})} className="flex-1 px-3 py-2 border border-[#E8DFD0] rounded-lg font-sans text-sm outline-none focus:border-[#C4956A]" />
                <label className="flex items-center gap-2 px-3 py-2 bg-[#C4956A] text-white rounded-lg font-sans text-sm font-semibold hover:bg-[#B8845A] cursor-pointer transition-colors disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={e => uploadImage(e.target.files?.[0])} disabled={uploading} className="hidden" />
                  {uploading ? 'Caricamento...' : 'Upload'}
                </label>
              </div>
              {form.logoUrl && (
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E8DFD0]">
                  <img src={form.logoUrl} alt="preview" className="w-10 h-10 rounded object-cover" />
                  <span className="font-sans text-xs text-[#666] flex-1 truncate">{form.logoUrl.split('/').pop()}</span>
                  <button onClick={deleteImage} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="font-sans text-xs text-[#999] mt-1">Carica logo (max 5MB) o incolla URL</p>
            </div>
            <input placeholder="Link sito web" value={form.link || ""} onChange={e => setForm({...form, link: e.target.value})} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
            <input placeholder="Email notifiche premio" value={form.contactEmail || ""} onChange={e => setForm({...form, contactEmail: e.target.value})} type="email" className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
            <select value={form.tier || "base"} onChange={e => setForm({...form, tier: e.target.value})} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] bg-white">
              {tiers.map(tier => (
                <option key={tier.key} value={tier.key}>{tier.label} — {tier.price}€/mese</option>
              ))}
            </select>
            <select value={form.gameType || "tutti"} onChange={e => setForm({...form, gameType: e.target.value})} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] bg-white">
              <option value="tutti">Tutti i giochi</option>
              <option value="gioco_poesie">Gioco delle Poesie</option>
              <option value="fortuna_italiana">Fortuna Italiana</option>
              <option value="fortuna_montelupo">Fortuna Montelupo</option>
            </select>
            <input placeholder="Descrizione premio" value={form.prizeDescription || ""} onChange={e => setForm({...form, prizeDescription: e.target.value})} className="px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
          </div>
          <textarea placeholder="Descrizione attività" value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] mb-4 resize-none" />
          <div className="flex items-center gap-3 mb-5">
            <input type="checkbox" id="active_s" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4" />
            <label htmlFor="active_s" className="font-sans text-sm text-[#555]">Attivo</label>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#C4956A] text-white px-6 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-[#B8845A] disabled:opacity-50 disabled:cursor-not-allowed"><Check className="w-4 h-4" /> {saving ? 'Salvataggio...' : 'Salva'}</button>
            <button onClick={() => setEditing(null)} className="flex items-center gap-2 border border-[#E8DFD0] px-6 py-2.5 rounded-xl font-sans text-sm text-[#666] hover:border-[#C4956A]"><X className="w-4 h-4" /> Annulla</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden">
        {sponsors.length === 0 ? (
          <div className="text-center py-16 font-sans text-[#999]">Nessuno sponsor. Aggiungine uno!</div>
        ) : (
          <div className="divide-y divide-[#F0E9DE]">
            {sponsors.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4">
                <div className="w-12 h-12 rounded-xl bg-[#F5EFE4] flex items-center justify-center flex-shrink-0 text-lg font-bold text-[#C4956A]">
                  {s.logoUrl ? <img src={s.logoUrl} className="w-full h-full object-contain rounded-xl" alt="" /> : s.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{s.name}</p>
                  <p className="font-sans text-xs text-[#999]">{s.prizeDescription}</p>
                </div>
                <span className={`font-sans text-xs px-2 py-1 rounded-full ${tierColors[s.tier]}`}>{s.tier}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setForm(s); setEditing(s.id); }} className="p-2 rounded-lg hover:bg-[#F5EFE4] text-[#999] hover:text-[#C4956A]"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => del(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#999] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
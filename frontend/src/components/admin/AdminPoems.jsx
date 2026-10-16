import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { Plus, Edit2, Trash2, X, Check, Upload, Trash, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const empty = { title: "", author: "", excerpt: "", thumbnailUrl: "", audioUrl: "", partA: "", partB: "", partC: "", active: true, publishedDate: new Date().toISOString().split("T")[0] };

export default function AdminPoems() {
  const { toast } = useToast();
  const [poems, setPoems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingPoemId, setSendingPoemId] = useState(null);
  const textareaRefs = useRef({ partA: null, partB: null, partC: null });

  const autoExpandTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleQuartineChange = (field, value) => {
    setForm({...form, [field]: value});
    setTimeout(() => {
      if (textareaRefs.current[field]) {
        autoExpandTextarea(textareaRefs.current[field]);
      }
    }, 0);
  };

  const generateTextPreview = () => {
    const parts = [form.partA, form.partB, form.partC].filter(p => p && p.trim().length > 0);
    return parts.join('\n\n');
  };

  // Expand textareas when form updates
  useEffect(() => {
    Object.values(textareaRefs.current).forEach(el => {
      if (el) autoExpandTextarea(el);
    });
  }, [form.partA, form.partB, form.partC]);

  const load = () => apiGet('/api/v1/poems', { limit: 50, sortBy: 'publishedDate', sortOrder: 'desc' })
    .then(res => setPoems(res.data || []))
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title.trim()) {
      toast({ variant: "destructive", title: "Errore", description: "Titolo è obbligatorio" });
      return;
    }
    if (!form.partA?.trim() || !form.partB?.trim() || !form.partC?.trim()) {
      toast({ variant: "destructive", title: "Errore", description: "Tutte e tre le quartine sono obbligatorie" });
      return;
    }
    setSaving(true);
    try {
      // Convert null values to empty strings for optional fields
      const payload = {
        ...form,
        author: form.author || "",
        excerpt: form.excerpt || "",
        thumbnailUrl: form.thumbnailUrl || "",
        audioUrl: form.audioUrl || "",
        partA: form.partA || "",
        partB: form.partB || "",
        partC: form.partC || "",
        publishedDate: form.publishedDate || new Date().toISOString().split('T')[0],
      };
      
      if (editing === "new") {
        await apiPost('/api/v1/poems', payload);
        toast({ title: "Successo", description: "Poesia creata" });
      } else {
        await apiPut(`/api/v1/poems/${editing}`, payload);
        toast({ title: "Successo", description: "Poesia aggiornata" });
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
    if (!confirm("Eliminare questa poesia?")) return;
    try {
      await apiDelete(`/api/v1/poems/${id}`);
      toast({ title: "Successo", description: "Poesia eliminata" });
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
      setForm({...form, thumbnailUrl: fullUrl});
      toast({ title: "Successo", description: "Immagine caricata" });
    } catch (err) {
      console.error('Upload error:', err);
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore nel caricamento immagine" });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async () => {
    if (!form.thumbnailUrl) return;
    try {
      const filename = form.thumbnailUrl.split('/').pop();
      await fetch(`/api/v1/upload/images/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setForm({...form, thumbnailUrl: ""});
      toast({ title: "Successo", description: "Immagine eliminata" });
    } catch (err) {
      console.error('Delete error:', err);
      toast({ variant: "destructive", title: "Errore", description: "Errore durante l'eliminazione" });
    }
  };

  const sendPoemNewsletter = async (poem) => {
    setSendingPoemId(poem.id);
    try {
      const res = await apiPost('/admin/newsletter/generate-poem-html', { poemId: poem.id });
      
      // Apri la modale di AdminNewsletter con il contenuto pre-compilato
      // Per ora, copia negli appunti e mostra un toast
      const htmlContent = res.html;
      const subject = res.subject;
      
      // Copia l'HTML negli appunti
      navigator.clipboard.writeText(htmlContent);
      
      toast({
        title: "HTML Generato",
        description: "HTML della poesia copiato negli appunti. Incolla nel form della newsletter per inviarla.",
      });
    } catch (err) {
      console.error('Generate poem error:', err);
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore nella generazione" });
    } finally {
      setSendingPoemId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Poesie ({poems.length})</h2>
        <button onClick={() => { setForm(empty); setEditing("new"); }} className="flex items-center gap-2 bg-[#C4956A] text-white px-5 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-[#B8845A] transition-colors">
          <Plus className="w-4 h-4" /> Nuova poesia
        </button>
      </div>

      {editing && (
        <div className="bg-white border border-[#E8DFD0] rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-5">{editing === "new" ? "Nuova poesia" : "Modifica poesia"}</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="font-sans text-xs text-[#666] block mb-1 font-semibold">Titolo *</label>
              <input placeholder="Es: Il Vasaio e la Terra" value={form.title || ""} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
            </div>
            <div>
              <label className="font-sans text-xs text-[#666] block mb-1 font-semibold">Autore</label>
              <input placeholder="Es: Lorenzo Bini" value={form.author || ""} onChange={e => setForm({...form, author: e.target.value})} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
            </div>
            <div>
              <label className="font-sans text-xs text-[#666] block mb-1 font-semibold">Data pubblicazione</label>
              <input type="date" value={form.publishedDate || ""} onChange={e => setForm({...form, publishedDate: e.target.value})} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A]" />
            </div>
            <div className="bg-[#FDFCF8] p-3 rounded-xl border border-[#E8DFD0]">
              <label className="font-sans text-xs text-[#666] block mb-2 font-semibold">Immagine thumbnail</label>
              <div className="flex gap-2 mb-2">
                <input placeholder="URL immagine" value={form.thumbnailUrl || ""} onChange={e => setForm({...form, thumbnailUrl: e.target.value})} className="flex-1 px-3 py-2 border border-[#E8DFD0] rounded-lg font-sans text-sm outline-none focus:border-[#C4956A]" />
                <label className="flex items-center gap-2 px-3 py-2 bg-[#C4956A] text-white rounded-lg font-sans text-sm font-semibold hover:bg-[#B8845A] cursor-pointer transition-colors disabled:opacity-50">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={e => uploadImage(e.target.files?.[0])} disabled={uploading} className="hidden" />
                  {uploading ? 'Caricamento...' : 'Upload'}
                </label>
              </div>
              {form.thumbnailUrl && (
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[#E8DFD0]">
                  <img src={form.thumbnailUrl} alt="preview" className="w-10 h-10 rounded object-cover" />
                  <span className="font-sans text-xs text-[#666] flex-1 truncate">{form.thumbnailUrl.split('/').pop()}</span>
                  <button onClick={deleteImage} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className="font-sans text-xs text-[#999] mt-1">Carica immagine (max 5MB) o incolla URL</p>
            </div>
          </div>
          <div>
            <label className="font-sans text-xs text-[#666] block mb-2 font-semibold">Anteprima (excerpt)</label>
            <textarea placeholder="Breve descrizione che appare nella lista poesie" value={form.excerpt || ""} onChange={e => setForm({...form, excerpt: e.target.value})} rows={2} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] mb-4 resize-none" />
          </div>
          
          <div>
            <label className="font-sans text-xs text-[#666] block mb-2 font-semibold">URL audio (voce autore)</label>
            <input placeholder="Es: https://..." value={form.audioUrl || ""} onChange={e => setForm({...form, audioUrl: e.target.value})} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] mb-4" />
          </div>
          
          <div className="bg-[#FDFCF8] p-4 rounded-xl border border-[#E8DFD0] mb-4">
            <h4 className="font-bold text-sm mb-3">Quartine (per GiocoPoesie)</h4>
            <textarea ref={el => textareaRefs.current.partA = el} placeholder="Quartina A" value={form.partA || ""} onChange={e => handleQuartineChange('partA', e.target.value)} rows={1} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] mb-3 resize-none overflow-hidden" style={{minHeight: '44px'}} />
            <textarea ref={el => textareaRefs.current.partB = el} placeholder="Quartina B" value={form.partB || ""} onChange={e => handleQuartineChange('partB', e.target.value)} rows={1} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] mb-3 resize-none overflow-hidden" style={{minHeight: '44px'}} />
            <textarea ref={el => textareaRefs.current.partC = el} placeholder="Quartina C" value={form.partC || ""} onChange={e => handleQuartineChange('partC', e.target.value)} rows={1} className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] resize-none overflow-hidden" style={{minHeight: '44px'}} />
            <p className="font-sans text-xs text-[#999] mt-2">Dividi la poesia in 3 quartine (strofe). Vengono usate dal gioco GiocoPoesie per le domande.</p>
            
            {(form.partA || form.partB || form.partC) && (
              <div className="mt-4 p-3 bg-white border border-[#E8DFD0] rounded-lg">
                <p className="font-sans text-xs text-[#999] mb-2 font-semibold">Anteprima poesia completa:</p>
                <div className="font-sans text-sm text-[#555] whitespace-pre-wrap leading-relaxed italic text-justify">
                  {generateTextPreview()}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mb-5">
            <input type="checkbox" id="active" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} className="w-4 h-4" />
            <label htmlFor="active" className="font-sans text-sm text-[#555]">Pubblicata (visibile al pubblico)</label>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <input type="checkbox" id="featured" checked={form.featured || false} onChange={e => setForm({...form, featured: e.target.checked})} className="w-4 h-4" />
            <label htmlFor="featured" className="font-sans text-sm text-[#555]">Mostra in home (evidenzia in home - max 3)</label>
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-[#C4956A] text-white px-6 py-2.5 rounded-xl font-sans text-sm font-semibold hover:bg-[#B8845A] disabled:opacity-50 disabled:cursor-not-allowed">
              <Check className="w-4 h-4" /> {saving ? 'Salvataggio...' : 'Salva'}
            </button>
            <button onClick={() => setEditing(null)} className="flex items-center gap-2 border border-[#E8DFD0] px-6 py-2.5 rounded-xl font-sans text-sm text-[#666] hover:border-[#C4956A]">
              <X className="w-4 h-4" /> Annulla
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden">
        {poems.length === 0 ? (
          <div className="text-center py-16 font-sans text-[#999]">Nessuna poesia. Crea la prima!</div>
        ) : (
          <div className="divide-y divide-[#F0E9DE]">
            {poems.map(poem => (
              <div key={poem.id} className="flex items-center gap-4 p-4">
                {poem.thumbnailUrl && <img src={poem.thumbnailUrl} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" alt="" />}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{poem.title}</p>
                  <p className="font-sans text-xs text-[#999]">{poem.author} · {poem.publishedDate}</p>
                </div>
                <span className={`font-sans text-xs px-2 py-1 rounded-full ${poem.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {poem.active ? "Pubblicata" : "Bozza"}
                </span>
                {poem.featured && (
                  <span className="font-sans text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">★ In home</span>
                )}
                <div className="flex gap-2">
                  <button onClick={() => sendPoemNewsletter(poem)} disabled={sendingPoemId === poem.id} className="p-2 rounded-lg hover:bg-purple-50 text-[#999] hover:text-purple-600 transition-colors disabled:opacity-50" title="Invia come poesia settimanale">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setForm(poem); setEditing(poem.id); }} className="p-2 rounded-lg hover:bg-[#F5EFE4] text-[#999] hover:text-[#C4956A] transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => del(poem.id)} className="p-2 rounded-lg hover:bg-red-50 text-[#999] hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
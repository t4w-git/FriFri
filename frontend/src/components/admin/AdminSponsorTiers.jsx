import { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { Edit2, X, Save, AlertCircle, Loader, Plus, Trash2 } from "lucide-react";

export default function AdminSponsorTiers() {
  const [tiers, setTiers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newFeature, setNewFeature] = useState("");

  // Carica i tier dal backend
  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/v1/admin/sponsor-tiers");
      setTiers(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      console.error("Load error:", err);
      setError(err.message || "Errore caricamento tier");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tier) => {
    setEditing(tier.id);
    setForm({ 
      ...tier,
      features: Array.isArray(tier.features) ? tier.features : []
    });
    setSuccess(null);
    setNewFeature("");
  };

  const addFeature = () => {
    if (newFeature.trim() === "") {
      setError("La feature non può essere vuota");
      return;
    }
    const updated = [...(form.features || []), newFeature];
    setForm({ ...form, features: updated });
    setNewFeature("");
    setError(null);
  };

  const removeFeature = (index) => {
    const updated = form.features.filter((_, i) => i !== index);
    setForm({ ...form, features: updated });
  };

  const save = async () => {
    if (!form.label || form.label.trim() === "") {
      setError("Etichetta obbligatoria");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        label: form.label,
        price: form.price || 0,
        color: form.color,
        badge: form.badge,
        features: form.features || [],
        popular: form.popular === true,
        active: form.active !== false
      };

      await apiPut(`/api/v1/admin/sponsor-tiers/${form.id}`, payload);

      setSuccess("Tier aggiornato con successo");
      setEditing(null);
      setForm(null);
      setNewFeature("");
      await loadTiers();
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setEditing(null);
    setForm(null);
    setNewFeature("");
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <div className="text-green-600 font-medium text-sm">{success}</div>
          <button
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-400 hover:text-green-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg text-[#1C1C1C]">Livelli di Sponsorship</h2>
        <button
          onClick={loadTiers}
          disabled={loading}
          className="text-sm px-3 py-1 border border-[#E8DFD0] rounded text-[#666] hover:bg-[#F9F6F0] disabled:opacity-50"
        >
          {loading ? "Caricamento..." : "Aggiorna"}
        </button>
      </div>

      {/* Loading State */}
      {loading && !tiers.length ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-[#C4956A] animate-spin" />
        </div>
      ) : (
        <>
          {/* Editing Form */}
          {editing && form && (
            <div className="bg-white border border-[#E8DFD0] rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#1C1C1C]">Modifica: {form.label}</h3>
                <button onClick={cancel} className="text-[#999] hover:text-[#1C1C1C]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-2">Etichetta</label>
                  <input
                    type="text"
                    value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
                    placeholder="es: Premium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-2">Prezzo (€/anno)</label>
                  <input
                    type="number"
                    value={form.price || 0}
                    onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
                    placeholder="500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-2">Colore (Tailwind)</label>
                  <input
                    type="text"
                    value={form.color || ""}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A] font-mono text-sm"
                    placeholder="border-purple-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-2">Badge (Tailwind)</label>
                  <input
                    type="text"
                    value={form.badge || ""}
                    onChange={e => setForm({ ...form, badge: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A] font-mono text-sm"
                    placeholder="bg-purple-100 text-purple-700"
                  />
                </div>
              </div>

              {/* Features List Management */}
              <div className="border-t border-[#E8DFD0] pt-4">
                <label className="block text-sm font-medium text-[#666] mb-3">Offerte e Benefici</label>
                
                {/* Add New Feature */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && addFeature()}
                    className="flex-1 px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A] text-sm"
                    placeholder="Scrivi una nuova feature..."
                  />
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-1 bg-[#C4956A] text-white px-3 py-2 rounded-lg hover:bg-[#B8844F] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Aggiungi
                  </button>
                </div>

                {/* Features List */}
                <div className="space-y-2">
                  {(form.features || []).length === 0 ? (
                    <p className="text-sm text-[#999] py-4 text-center">Nessuna feature aggiunta</p>
                  ) : (
                    (form.features || []).map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-[#F9F6F0] p-3 rounded-lg border border-[#E8DFD0]"
                      >
                        <span className="text-sm text-[#333]">✓ {feature}</span>
                        <button
                          onClick={() => removeFeature(idx)}
                          className="text-[#D9534F] hover:text-[#C9302C] p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-3 items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.popular === true}
                    onChange={e => setForm({ ...form, popular: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-[#666]">Piano popolare</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active !== false}
                    onChange={e => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-[#666]">Attivo</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#C4956A] text-white px-4 py-2 rounded-lg hover:bg-[#B8844F] disabled:opacity-60 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Salvataggio..." : "Salva"}
                </button>
                <button
                  onClick={cancel}
                  className="px-4 py-2 border border-[#E8DFD0] text-[#666] rounded-lg hover:bg-[#F9F6F0] transition-colors"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

          {/* Tiers List */}
          <div className="space-y-3">
            {tiers.length === 0 ? (
              <div className="text-center py-8 text-[#999]">
                <p>Nessun tier configurato</p>
              </div>
            ) : (
              tiers.map(tier => (
                <div
                  key={tier.id}
                  className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                    tier.active ? "border-[#E8DFD0]" : "border-[#F0E8DC] opacity-60"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-[#1C1C1C]">{tier.label}</h4>
                      {tier.popular && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${tier.badge || "bg-purple-100 text-purple-700"}`}>
                          POPOLARE
                        </span>
                      )}
                      {!tier.active && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                          INATTIVO
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-sm text-[#777] mt-1">€{tier.price}/anno</p>
                    {tier.features && tier.features.length > 0 && (
                      <ul className="text-xs text-[#888] mt-2 space-y-1">
                        {tier.features.slice(0, 2).map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                        {tier.features.length > 2 && (
                          <li>• +{tier.features.length - 2} altro</li>
                        )}
                      </ul>
                    )}
                  </div>
                  <button
                    onClick={() => startEdit(tier)}
                    className="text-[#C4956A] hover:text-[#A0714F] transition-colors p-2"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Info:</strong> I tier definiscono i livelli di sponsorship. Modifica prezzo, features e stato per aggiornare automaticamente la pagina pubblica.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

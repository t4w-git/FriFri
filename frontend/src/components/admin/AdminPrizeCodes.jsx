import { useState, useEffect } from "react";
import { apiGet, apiPut } from "@/lib/api";
import { Gift, Check, Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminPrizeCodes() {
  const { toast } = useToast();
  const [codes, setCodes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await apiGet('/api/v1/prize-codes', { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' });
        setCodes(res.data || []);
      } catch (error) {
        console.error('Failed to fetch prize codes:', error);
        toast({ variant: "destructive", title: "Errore", description: "Impossibile caricare i codici" });
      } finally {
        setLoading(false);
      }
    };
    fetchCodes();
  }, []);

  const markRedeemed = async (id) => {
    try {
      await apiPut(`/api/v1/prize-codes/${id}`, { redeemed: true, redeemedDate: new Date().toISOString() });
      setCodes(prev => prev.map(c => c.id === id ? { ...c, redeemed: true } : c));
      toast({ title: "Successo", description: "Codice segnato come riscattato" });
    } catch (error) {
      console.error('Failed to update prize code:', error);
      toast({ variant: "destructive", title: "Errore", description: error.message || "Errore nell'aggiornamento" });
    }
  };

  const filtered = codes.filter(c => {
    const matchSearch = !search || c.code?.includes(search.toUpperCase()) || c.player_email?.includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "redeemed" ? c.redeemed : !c.redeemed);
    return matchSearch && matchFilter;
  });

  const stats = { total: codes.length, redeemed: codes.filter(c => c.redeemed).length, pending: codes.filter(c => !c.redeemed).length };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Codici Premio</h2>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Totale codici", value: stats.total, color: "text-[#1C1C1C]" },
          { label: "Da riscattare", value: stats.pending, color: "text-yellow-600" },
          { label: "Riscattati", value: stats.redeemed, color: "text-green-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E8DFD0] text-center">
            <p className={`text-4xl font-bold ${s.color}`}>{s.value}</p>
            <p className="font-sans text-xs text-[#999] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca codice o email..." className="w-full pl-9 pr-4 py-2.5 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] bg-white" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "redeemed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-colors ${filter === f ? "bg-[#C4956A] text-white" : "bg-white border border-[#E8DFD0] text-[#666]"}`}>
              {f === "all" ? "Tutti" : f === "pending" ? "Da riscattare" : "Riscattati"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DFD0] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Gift className="w-10 h-10 text-[#E8DFD0] mx-auto mb-3" />
            <p className="font-sans text-[#999]">Nessun codice trovato</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F0E9DE]">
            {filtered.map(code => (
              <div key={code.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-sm text-[#C4956A]">{code.code}</p>
                  <p className="font-sans text-xs text-[#999]">{code.player_email} · {code.game_type?.replace(/_/g, " ")} · {code.sponsor_name}</p>
                  <p className="font-sans text-xs text-[#777] mt-0.5">{code.prize_description}</p>
                </div>
                <div className="text-right">
                  {code.redeemed ? (
                    <span className="flex items-center gap-1 font-sans text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <Check className="w-3 h-3" /> Riscattato {code.redeemed_date && `il ${code.redeemed_date}`}
                    </span>
                  ) : (
                    <button onClick={() => markRedeemed(code.id)} className="font-sans text-xs bg-[#C4956A] text-white px-4 py-1.5 rounded-full hover:bg-[#B8845A] transition-colors">
                      Segna riscattato
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import { Users, Gamepad2, Trophy, Mail, TrendingUp } from "lucide-react";

export default function AdminStats() {
  const [stats, setStats] = useState({ sessions: [], prizes: [], subscribers: [], sponsors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      apiGet('/api/v1/game-sessions', { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' }),
      apiGet('/api/v1/prize-codes', { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' }),
      apiGet('/api/v1/newsletter', { active: 'true', limit: 200, sortBy: 'createdAt', sortOrder: 'desc' }),
      fetch('/api/v1/public/sponsors?limit=200').then(r => r.json()),
    ]).then(([sessionsRes, prizesRes, subscribersRes, sponsorsRes]) => {
      setStats({
        sessions: sessionsRes.data || [],
        prizes: prizesRes.data || [],
        subscribers: subscribersRes.data || [],
        sponsors: sponsorsRes.data || [],
      });
    }).catch((err) => {
      console.error('Stats error:', err);
      setError(err.message);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-[#C4956A] border-t-transparent rounded-full animate-spin" /></div>;
  
  if (error) return <div className="text-center py-20 text-red-600">Errore: {error}</div>;

  const wins = stats.sessions.filter(s => s.result === "win").length;
  const redeemed = stats.prizes.filter(p => p.redeemed).length;
  const byGame = ["gioco_poesie", "fortuna_italiana", "fortuna_montelupo"].map(g => ({
    name: g.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    plays: stats.sessions.filter(s => s.game_type === g).length,
    wins: stats.sessions.filter(s => s.game_type === g && s.result === "win").length,
  }));

  const cards = [
    { label: "Partite totali", value: stats.sessions.length, icon: Gamepad2, color: "text-blue-600 bg-blue-50" },
    { label: "Premi assegnati", value: wins, icon: Trophy, color: "text-yellow-600 bg-yellow-50" },
    { label: "Premi riscattati", value: redeemed, icon: TrendingUp, color: "text-green-600 bg-green-50" },
    { label: "Iscritti newsletter", value: stats.subscribers.length, icon: Mail, color: "text-purple-600 bg-purple-50" },
    { label: "Sponsor attivi", value: stats.sponsors.length, icon: Users, color: "text-[#C4956A] bg-orange-50" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#1C1C1C] mb-8">Dashboard</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#E8DFD0]">
            <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-3xl font-bold text-[#1C1C1C]">{c.value}</p>
            <p className="font-sans text-xs text-[#999] mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-[#E8DFD0]">
          <h3 className="font-bold mb-5">Statistiche per gioco</h3>
          <div className="flex flex-col gap-4">
            {byGame.map((g, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1.5">
                  <span className="font-sans text-sm text-[#555]">{g.name}</span>
                  <span className="font-sans text-sm font-semibold">{g.plays} partite · {g.wins} premi</span>
                </div>
                <div className="h-2 bg-[#F0E9DE] rounded-full overflow-hidden">
                  <div className="h-full bg-[#C4956A] rounded-full transition-all" style={{ width: `${g.plays > 0 ? (g.wins / g.plays) * 100 : 0}%` }} />
                </div>
                <p className="font-sans text-xs text-[#BBB] mt-1">Tasso vittoria: {g.plays > 0 ? Math.round((g.wins / g.plays) * 100) : 0}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-[#E8DFD0]">
          <h3 className="font-bold mb-5">Sponsor per tier</h3>
          {["gold", "premium", "base"].map(tier => {
            const count = stats.sponsors.filter(s => s.tier === tier).length;
            const colors = { gold: "bg-yellow-500", premium: "bg-purple-500", base: "bg-gray-400" };
            return (
              <div key={tier} className="flex items-center justify-between py-3 border-b border-[#F0E9DE] last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${colors[tier]}`} />
                  <span className="font-sans text-sm capitalize">{tier}</span>
                </div>
                <span className="font-bold text-sm">{count} sponsor</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
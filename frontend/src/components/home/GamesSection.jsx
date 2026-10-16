import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, ArrowRight, Zap, X } from "lucide-react";
import { apiPost } from "@/lib/api";

const games = [
  {
    emoji: "🎴",
    title: "Gioco delle Poesie",
    description: "Abbina i versi mancenti. 3 domande, 2 risposte corrette per vincere il premio settimanale.",
    page: "GiocoPoesie",
    gameType: "gioco_poesie",
    bg: null,
    accent: "#6B46C1",
  },
  {
    emoji: "🎰",
    title: "Fortuna Italiana",
    description: "Quiz sulla letteratura italiana. Rispondi bene e gira la ruota della fortuna.",
    page: "FortunaItaliana",
    gameType: "fortuna_italiana",
    bg: null,
    accent: "#2D6A4F",
  },
  {
    emoji: "🏺",
    title: "Fortuna Montelupo",
    description: "Il gioco della ceramica. Scegli il vaso giusto e vinci un premio artigianale del territorio.",
    page: "FortunaMontelupo",
    gameType: "fortuna_montelupo",
    bg: null,
    accent: "#9B2226",
  },
];

export default function GamesSection({ gameSponsors }) {
  const navigate = useNavigate();
  const [selectedGameType, setSelectedGameType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectSponsor = async (sponsor, game) => {
    setLoading(true);
    try {
      // Reserve the session with sponsor
      const res = await apiPost('/api/v1/game-sessions/reserve', {
        gameType: game.gameType,
        sponsorId: sponsor.id
      });

      // Navigate to game with sessionId
      navigate(createPageUrl(game.page) + `?sessionId=${res.sessionId}`);
    } catch (err) {
      alert('Errore nella prenotazione, riprova');
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-4 bg-[#1C1C1C] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, #C4956A 0%, transparent 50%), radial-gradient(circle at 80% 20%, #C4956A 0%, transparent 40%)`
      }} />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-4 h-4 text-[#C4956A]" />
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A]">Sfida culturale</p>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Gioca<br/><span className="text-[#C4956A]">e vinci</span>
            </h2>
          </div>
          <p className="font-sans text-base text-white/40 max-w-xs leading-relaxed">
            Tre giochi, una settimana, premi reali offerti dagli sponsor del territorio.
          </p>
        </div>

        {/* Games grid */}
        <div className="grid md:grid-cols-3 gap-5">
          {games.map((game) => {
            const sponsors = gameSponsors[game.gameType] || [];
            const isModalOpen = selectedGameType === game.gameType;
            
            return (
              <div key={game.page} className="group relative rounded-3xl overflow-hidden">
                {/* Background image */}
                <div className="absolute inset-0">
                  {game.bg && <img src={game.bg} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-30" />}
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${game.accent}CC 0%, #0D0D0D 100%)` }} />
                </div>

                {/* Content */}
                <div className="relative p-7 flex flex-col min-h-[360px]">
                  <div className="text-5xl mb-5">{game.emoji}</div>
                  <h3 className="text-white text-xl font-bold mb-3">{game.title}</h3>
                  <p className="text-white/60 font-sans text-sm leading-relaxed mb-6 flex-1">{game.description}</p>

                  {/* Prize box */}
                  <div className="border border-white/15 rounded-xl p-4 mb-5 bg-white/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      <span className="font-sans text-xs uppercase tracking-wider text-yellow-400 font-semibold">Premi disponibili</span>
                    </div>
                    {sponsors.length > 0 ? (
                      <div className="space-y-1">
                        {sponsors.slice(0, 2).map((sponsor) => (
                          <p key={sponsor.id} className="text-white/80 text-xs font-sans line-clamp-1">
                            • {sponsor.prizeDescription || sponsor.name}
                          </p>
                        ))}
                        {sponsors.length > 2 && (
                          <p className="text-white/50 text-xs font-sans italic">+{sponsors.length - 2} altri premi</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-white/80 text-sm font-sans">Premi in arrivo...</p>
                    )}
                  </div>

                  {/* Play button - opens sponsor selector if multiple sponsors */}
                  <button
                    onClick={() => {
                      if (sponsors.length > 1) {
                        setSelectedGameType(game.gameType);
                      } else if (sponsors.length === 1) {
                        handleSelectSponsor(sponsors[0], game);
                      }
                    }}
                    disabled={sponsors.length === 0 || loading}
                    className="flex items-center justify-between px-5 py-3.5 rounded-xl font-sans font-semibold text-sm bg-white/10 text-white hover:bg-[#C4956A] transition-colors group/btn border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Gioca ora
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Sponsor selector modal */}
                {isModalOpen && sponsors.length > 1 && (
                  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1C1C1C] rounded-2xl border border-[#C4956A]/30 max-w-md w-full p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Scegli il premio</h3>
                        <button
                          onClick={() => setSelectedGameType(null)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-white/60 mb-4">Scegli per quale premio vuoi giocare:</p>
                      <div className="space-y-2">
                        {sponsors.map((sponsor) => (
                          <button
                            key={sponsor.id}
                            onClick={() => {
                              handleSelectSponsor(sponsor, game);
                              setSelectedGameType(null);
                            }}
                            disabled={loading}
                            className="w-full text-left p-4 rounded-lg border border-white/10 hover:border-[#C4956A] hover:bg-white/5 transition-colors disabled:opacity-50"
                          >
                            {sponsor.logoUrl && (
                              <img src={sponsor.logoUrl} alt={sponsor.name} className="h-8 mb-2" />
                            )}
                            <p className="text-white font-semibold text-sm">{sponsor.name}</p>
                            <p className="text-white/60 text-xs">{sponsor.prizeDescription}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
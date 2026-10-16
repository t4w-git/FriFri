import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, Clock, Users, ChevronRight } from "lucide-react";
import SectionWithAds from "@/components/ads/SectionWithAds";

const games = [
  {
    emoji: "🎴",
    title: "Gioco delle Poesie",
    description: "Leggi la poesia e abbina il verso mancante. Tre risposte, una sola è quella giusta. Dimostra di conoscere la poesia di Montelupo.",
    prize: "Buono spesa €30 presso le attività locali",
    attempts: "1 tentativo al giorno",
    page: "GiocoPoesie",
    difficulty: "Media",
    bg: "bg-gradient-to-br from-[#2D1B69] to-[#4A2C8F]",
  },
  {
    emoji: "🎰",
    title: "Fortuna Italiana",
    description: "Un quiz culturale sulla letteratura italiana. Rispondi correttamente e la fortuna potrebbe sorriderti con un premio esclusivo.",
    prize: "Premio esclusivo sponsor Gold",
    attempts: "2 tentativi a settimana",
    page: "FortunaItaliana",
    difficulty: "Facile",
    bg: "bg-gradient-to-br from-[#1A3A2A] to-[#2D5A3D]",
  },
  {
    emoji: "🏺",
    title: "Fortuna Montelupo",
    description: "Il gioco della ceramica toscana. Scegli tra tre vasi — uno nasconde il premio. Ogni settimana un nuovo sponsor e un nuovo premio.",
    prize: "Prodotti artigianali locali",
    attempts: "1 tentativo al giorno",
    page: "FortunaMontelupo",
    difficulty: "Fortuna",
    bg: "bg-gradient-to-br from-[#5C2A1A] to-[#8B3E2A]",
  },
];

export default function Giochi() {
  return (
    <div>
      {/* Header */}
      <div className="bg-[#1C1C1C] py-20 px-4 text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.3em] text-[#C4956A] mb-4">Sfida culturale</p>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">I Giochi</h1>
        <p className="font-sans text-base text-white/60 max-w-md mx-auto">
          Tre giochi, premi reali ogni settimana offerti dagli sponsor del territorio.
        </p>
      </div>
      {/* Content with Ads */}
      <SectionWithAds>
        <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Regole generali */}
        <div className="bg-[#F5EFE4] rounded-2xl p-6 mb-12 grid sm:grid-cols-3 gap-4 text-center">
          <div>
            <Trophy className="w-6 h-6 text-[#C4956A] mx-auto mb-2" />
            <p className="font-bold text-sm mb-1">Premi reali</p>
            <p className="font-sans text-xs text-[#777]">Offerti dagli sponsor locali ogni settimana</p>
          </div>
          <div>
            <Clock className="w-6 h-6 text-[#C4956A] mx-auto mb-2" />
            <p className="font-bold text-sm mb-1">Reset settimanale</p>
            <p className="font-sans text-xs text-[#777]">I tentativi si resettano ogni lunedì mattina</p>
          </div>
          <div>
            <Users className="w-6 h-6 text-[#C4956A] mx-auto mb-2" />
            <p className="font-bold text-sm mb-1">Email richiesta</p>
            <p className="font-sans text-xs text-[#777]">Solo per ricevere il codice premio</p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {games.map((game) => (
            <div key={game.page} className={`${game.bg} rounded-3xl p-8 text-white`}>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="text-6xl">{game.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{game.title}</h2>
                    <span className="font-sans text-xs px-3 py-1 rounded-full bg-white/15 text-white/80">{game.difficulty}</span>
                  </div>
                  <p className="font-sans text-white/70 text-sm leading-relaxed mb-4">{game.description}</p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="font-sans text-sm text-white/90">{game.prize}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-white/60" />
                      <span className="font-sans text-xs text-white/60">{game.attempts}</span>
                    </div>
                  </div>
                </div>
                <Link
                  to={createPageUrl(game.page)}
                  className="flex items-center gap-2 bg-white text-[#1C1C1C] px-7 py-3.5 rounded-full font-sans font-semibold text-sm hover:bg-[#C4956A] hover:text-white transition-colors whitespace-nowrap self-start md:self-center"
                >
                  Gioca ora <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
        </div>
      </SectionWithAds>
    </div>
  );
}
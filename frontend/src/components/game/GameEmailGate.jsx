import { useState, useEffect } from "react";
import { Trophy, Mail } from "lucide-react";
import GameCountdown from "./GameCountdown";

export default function GameEmailGate({ gameTitle, gameDescription, prize, sponsorName, sponsorLogo, sessionId, onEnter, fingerprint, cooldownSeconds = null }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [buttonTimeLeft, setButtonTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (cooldownSeconds === null) return;
    
    const calc = () => {
      const diff = Math.max(0, cooldownSeconds - Math.floor((Date.now() - (window.__gateCountdownStartTime || Date.now())) / 1000));
      setButtonTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    
    window.__gateCountdownStartTime = Date.now();
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Inserisci un indirizzo email valido");
      return;
    }

    // Delegate session confirmation / creation to the parent page, passing both email and fingerprint
    onEnter(email, fingerprint);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#F5EFE4]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">{gameTitle}</h1>
          <p className="font-sans text-[#777] text-sm">{gameDescription}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DFD0]">
          <div className="bg-[#F5EFE4] rounded-xl p-5 mb-6 flex gap-4 items-start">
            <Trophy className="w-5 h-5 text-[#C4956A] mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-sans text-xs text-[#C4956A] font-semibold uppercase tracking-wide mb-2">Premio questa settimana</p>
              {sponsorLogo && (
                <img src={sponsorLogo} alt={sponsorName || 'sponsor'} className="h-10 mb-2" />
              )}
              <p className="font-sans text-sm text-[#333] font-medium">{prize}</p>
              {sponsorName && <p className="font-sans text-xs text-[#999] mt-1">Offerto da {sponsorName}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="block font-sans text-sm font-medium text-[#555] mb-2">
              <Mail className="w-4 h-4 inline mr-2 text-[#C4956A]" />
              La tua email (per ricevere il codice premio)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              placeholder="nome@esempio.it"
              className="w-full px-4 py-3 border border-[#E8DFD0] rounded-xl font-sans text-sm outline-none focus:border-[#C4956A] transition-colors mb-1"
              disabled={loading}
            />
            {error && <p className="font-sans text-xs text-red-500 mb-3">{error}</p>}
            <p className="font-sans text-xs text-[#BBB] mb-5 mt-2">
              Usiamo la tua email solo per inviare il codice premio. Niente spam.
            </p>
            <button
              type="submit"
              disabled={loading || cooldownSeconds !== null}
              className="w-full py-4 bg-[#C4956A] text-white rounded-xl font-sans font-semibold text-sm hover:bg-[#B8845A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cooldownSeconds !== null 
                ? `Riprova tra ${String(buttonTimeLeft.h).padStart(2,"0")}:${String(buttonTimeLeft.m).padStart(2,"0")}:${String(buttonTimeLeft.s).padStart(2,"0")}`
                : loading ? "Caricamento..." : "Gioca ora →"
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiPost, apiGet } from "@/lib/api";
import GameEmailGate from "@/components/game/GameEmailGate";
import { useFingerprint } from "@/hooks/useFingerprint";

/**
 * FORTUNA MONTELUPO - Roulette with inline win/loss display (no separate screens)
 * 2 slots. Win: same poem part text
 * Admin sets how many attempts until win (no right/wrong answer)
 */

export default function FortunaMontelupo() {
  const [searchParams] = useSearchParams();
  const sessionIdFromUrl = searchParams.get('sessionId');
  const sponsorIdFromUrl = searchParams.get('sponsorId');
  const { fingerprint } = useFingerprint();
  
  const [email, setEmail] = useState(null);
  const [phase, setPhase] = useState("gate");
  const [sessionId, setSessionId] = useState(sessionIdFromUrl || null);
  const [sponsor, setSponsor] = useState(null);
  const [previewSponsor, setPreviewSponsor] = useState(null);
  const [gateErrorCooldown, setGateErrorCooldown] = useState(null); // Cooldown for mail gate
  const [spinning, setSpinning] = useState(false);
  const [slots, setSlots] = useState([null, null]);
  const [initialSlot, setInitialSlot] = useState(null); // Store initial slot
  const [result, setResult] = useState(null);
  const [prizeCode, setPrizeCode] = useState(null);
  const [prizeInfo, setPrizeInfo] = useState(null);
  const [postGameCooldown, setPostGameCooldown] = useState(0); // Cooldown after game ends
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [postGameCooldownTime, setPostGameCooldownTime] = useState({ h: 0, m: 0, s: 0 });
  const [isBlocked, setIsBlocked] = useState(false);

  const loadInitialSlot = async (id) => {
    try {
      const session = await apiGet(`/api/v1/game-sessions/${id}`);
      if (session.winningAnswerText) {
        setInitialSlot({ partText: session.winningAnswerText, partIndex: 0 });
        setSlots([{ partText: session.winningAnswerText, partIndex: 0 }, null]);
      } else {
        setInitialSlot(null);
        setSlots([null, null]);
      }
    } catch {
      setInitialSlot(null);
      setSlots([null, null]);
    }
  };

  const refreshCooldownStatus = async () => {
    if (!email) return;
    try {
      const status = await apiGet('/api/v1/game-sessions/attempts-status', { 
        email: email.toLowerCase(), 
        gameType: 'fortuna_montelupo',
        browserFingerprint: fingerprint
      });
      
      if (status.attemptsRemaining <= 0) {
        setCooldownMessage('Hai esaurito i tentativi di oggi');
        setIsBlocked(true);
        setPostGameCooldown(0);
        return;
      }

      setIsBlocked(false);
      if (status.cooldownUntilMs && status.cooldownUntilMs > Date.now()) {
        const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
        setPostGameCooldown(secondsRemaining);
        setCooldownMessage(`Riprova tra ${secondsRemaining} secondi`);
        
        // Start countdown timer
        const interval = setInterval(() => {
          setPostGameCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setCooldownMessage(null);
              setIsBlocked(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setPostGameCooldown(0);
        setCooldownMessage(null);
      }
    } catch {
      console.log('Could not check cooldown');
    }
  };

  // Fetch sponsor from URL param or from session
  useEffect(() => {
    const fetchPreviewSponsor = async () => {
      try {
        if (sponsorIdFromUrl) {
          const data = await apiGet(`/api/v1/public/sponsors/${sponsorIdFromUrl}`);
          setPreviewSponsor(data);
        } else if (sessionIdFromUrl) {
          const session = await apiGet(`/api/v1/game-sessions/${sessionIdFromUrl}`);
          if (session.sponsor) {
            setPreviewSponsor(session.sponsor);
            setSponsor(session.sponsor);
          }
        } else {
          const response = await apiGet('/api/v1/public/sponsors', { active: 'true', gameType: 'fortuna_montelupo', limit: 1 });
          if (response.data && response.data.length > 0) {
            setPreviewSponsor(response.data[0]);
          }
        }
      } catch (err) {
        console.log('Could not fetch preview sponsor');
      }
    };
    fetchPreviewSponsor();
  }, [sponsorIdFromUrl, sessionIdFromUrl]);

  useEffect(() => {
    if (!email) return;
    const initSession = async () => {
      try {
        let activeSessionId = sessionId;
        if (sessionId && !sessionId.includes('pending')) {
          // Confirm email on existing session
          const res = await apiPost(`/api/v1/game-sessions/${sessionId}/confirm-email`, { 
            email,
            browserFingerprint: fingerprint
          });
          setSponsor(res.sponsor);
          setSessionId(res.sessionId);
          activeSessionId = res.sessionId;
        } else {
          // Create new session
          const res = await apiPost('/api/v1/game-sessions/start', { 
            email, 
            gameType: 'fortuna_montelupo',
            preferredSponsorId: previewSponsor?.id,
            browserFingerprint: fingerprint
          });
          setSponsor(res.sponsor);
          setSessionId(res.sessionId);
          activeSessionId = res.sessionId;
        }

        await loadInitialSlot(activeSessionId);
        setPhase("playing");
        refreshCooldownStatus();
      } catch (err) {
        if (err.status === 429) {
          if (err.data?.error?.retryAfterSeconds) {
            setGateErrorCooldown(err.data.error.retryAfterSeconds);
            setTimeout(() => setGateErrorCooldown(null), err.data.error.retryAfterSeconds * 1000);
          } else {
            alert('Hai esaurito i tentativi di oggi. Riprova domani!');
          }
        } else {
          alert('Errore');
        }
        setEmail(null);
        setPhase("gate");
      }
    };

    initSession();
  }, [email, previewSponsor, fingerprint]);

  // Format postGameCooldown for button display
  useEffect(() => {
    const diff = Math.max(0, postGameCooldown);
    setPostGameCooldownTime({
      h: Math.floor(diff / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    });
  }, [postGameCooldown]);

  const handlePlay = async () => {
    if (!sessionId || spinning || postGameCooldown > 0 || isBlocked) return;
    
    // If this session is already completed, create a new one first
    if (result !== null) {
      setSpinning(true);
      try {
        const newSessionRes = await apiPost('/api/v1/game-sessions/start', { 
          email: email.toLowerCase(), 
          gameType: 'fortuna_montelupo',
          preferredSponsorId: sponsor?.id,
          browserFingerprint: fingerprint
        });
        setSessionId(newSessionRes.sessionId);
        setSponsor(newSessionRes.sponsor);
        setResult(null);
        setPrizeCode(null);
        setPrizeInfo(null);
        setPostGameCooldown(0);
        await loadInitialSlot(newSessionRes.sessionId);
        setSpinning(false);
        return;
      } catch (err) {
        alert('Errore nella creazione della nuova partita');
        setSpinning(false);
        return;
      }
    }

    setSpinning(true);
    setResult(null);
    setPrizeCode(null);
    setPrizeInfo(null);
    
    try {
      // Generate random spinning animation with 5-6 iterations
      const spinCount = 5;
      const spinDuration = 2000; // 2 seconds for animation
      const spinInterval = spinDuration / spinCount;
      
      // Pre-generate random slots for smooth animation (only second slot animates)
      const randomSlotsForAnimation = Array(spinCount).fill(null).map(() => ({
        partText: 'Quartina...',
        partIndex: Math.floor(Math.random() * 3)
      }));
      
      let animationStep = 0;
      const spinAnimInterval = setInterval(() => {
        if (animationStep < randomSlotsForAnimation.length) {
          setSlots([initialSlot, randomSlotsForAnimation[animationStep]]);
          animationStep++;
        }
      }, spinInterval);
      
      // After animation, call backend to get actual result
      setTimeout(async () => {
        clearInterval(spinAnimInterval);
        
        const response = await apiPost(`/api/v1/game-sessions/${sessionId}/fortune-montelupo`);
        setSlots(response.slots || [null, null]);
        setResult(response);

        // If won, generate prize after showing result
        if (response.won) {
          setTimeout(async () => {
            try {
              const prizeRes = await apiPost(`/api/v1/game-sessions/${sessionId}/generate-prize`, { sessionId });
              setPrizeCode(prizeRes.prizeCode);
              setPrizeInfo({
                description: prizeRes.prizeDescription,
                sponsor: prizeRes.sponsorName,
                logo: prizeRes.sponsorLogo
              });
            } catch (err) {
              // Silently handle prize generation errors
            }
          }, 500);
        }

        // Check actual cooldown from server immediately after game
        checkCooldownAfterGame();
        
        setSpinning(false);
      }, spinDuration);
    } catch (err) {
      if (err.status === 429) {
        await refreshCooldownStatus();
      }
      setSpinning(false);
    }
  };

  const checkCooldownAfterGame = async () => {
    try {
      const status = await apiGet('/api/v1/game-sessions/attempts-status', { 
        email: email.toLowerCase(), 
        gameType: 'fortuna_montelupo',
        browserFingerprint: fingerprint
      });
      
      if (status.attemptsRemaining <= 0) {
        setCooldownMessage('Hai esaurito i tentativi di oggi');
        setIsBlocked(true);
        setPostGameCooldown(0);
        return;
      }

      setIsBlocked(false);
      if (status.cooldownUntilMs && status.cooldownUntilMs > Date.now()) {
        const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
        setPostGameCooldown(secondsRemaining);
        setCooldownMessage(`Riprova tra ${secondsRemaining} secondi`);
        
        // Start countdown timer
        const interval = setInterval(() => {
          setPostGameCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setCooldownMessage(null);
              setIsBlocked(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.log('Could not check post-game cooldown');
    }
  };

  if (phase === "gate") return <GameEmailGate gameTitle="🏺 Fortuna Montelupo" prize={previewSponsor?.prizeDescription} sponsorName={previewSponsor?.name} sponsorLogo={previewSponsor?.logoUrl} sessionId={sessionId} fingerprint={fingerprint} cooldownSeconds={gateErrorCooldown} onEnter={(e) => { setEmail(e); }} />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#F5EFE4] to-white">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="font-sans text-xs text-[#C4956A] uppercase tracking-widest mb-3">Gioco della Fortuna</p>
          <h1 className="text-5xl font-bold text-[#1C1C1C] mb-3">🏺 Fortuna Montelupo</h1>
          <p className="text-sm text-gray-600">Un vasetto nasconde il premio. Prova a indovinare!</p>
        </div>

        {/* Prize info - shown BEFORE playing */}
        {!result && sponsor && (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-xl p-6 mb-8 shadow-md">
            {sponsor.logoUrl && (
              <img src={sponsor.logoUrl} alt={sponsor.name} className="h-14 mx-auto mb-3" />
            )}
            <p className="text-xs font-normal text-gray-600 mb-2">SE VINCI OTTERRAI:</p>
            <p className="text-lg font-bold text-blue-800">{sponsor.prizeDescription || 'un premio esclusivo'}</p>
          </div>
        )}

        {/* Instructions */}
        {!result && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-6 mb-8 shadow-md">
            <h3 className="font-bold text-amber-900 mb-4 text-center">📍 Come giocare:</h3>
            
            {/* Display the initial poem text prominently */}
            <div className="bg-white rounded-lg p-4 border-2 border-amber-300 mb-5 min-h-20 flex items-center justify-center">
              {initialSlot && initialSlot.partText ? (
                <p className="text-sm font-semibold leading-relaxed text-gray-800 text-center">
                  {initialSlot.partText}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">Caricamento quartina...</p>
              )}
            </div>
            
            <p className="text-xs text-center text-gray-700 font-medium mb-2">👆 Questa è la quartina del 1° vasetto</p>
            <p className="text-xs text-center text-gray-600 italic">Premi GIRA IL VASETTO per fare uscire una quartina casuale. Se corrisponde a questa... hai vinto! 🎲</p>
          </div>
        )}

        {/* Slots - ONE visible poem + ONE empty/spinning slot */}
        <div className="mb-10">
          {/* First slot - ALWAYS show the initial poem */}
          <div className="mb-6">
            <h2 className="text-center text-sm font-bold text-gray-700 mb-3">🏺 Quartina da battere:</h2>
            <div className="w-full bg-gradient-to-br from-[#E8C5A0] to-[#C7956F] rounded-2xl border-4 border-[#8B6F47] shadow-xl p-6 min-h-32 flex items-center justify-center">
              {initialSlot && initialSlot.partText ? (
                <p className="text-base font-bold leading-relaxed text-[#333] text-center">
                  {initialSlot.partText}
                </p>
              ) : (
                <p className="text-gray-500 text-sm">Caricamento...</p>
              )}
            </div>
          </div>

          {/* Second slot - EMPTY initially, then shuffles during play */}
          <div>
            <h2 className="text-center text-sm font-bold text-gray-700 mb-3">🎲 Vasetto misterioso:</h2>
            <div className={`w-full bg-gradient-to-br from-[#E8C5A0] to-[#C7956F] rounded-2xl border-4 border-[#8B6F47] shadow-xl p-6 min-h-32 flex items-center justify-center transition-all ${
              spinning ? 'animate-pulse' : ''
            }`}>
              {slots[1] && slots[1].partText && slots[1].partText !== 'Quartina...' ? (
                <p className="text-base font-bold leading-relaxed text-[#333] text-center">
                  {slots[1].partText}
                </p>
              ) : spinning ? (
                <div className="text-3xl animate-spin">🎲</div>
              ) : (
                <div className="text-5xl opacity-20">?</div>
              )}
            </div>
          </div>
        </div>

        {/* Play Button */}
        <div className="text-center mb-10">
          {cooldownMessage && (
            <p className="text-sm text-gray-600 mb-4">{cooldownMessage}</p>
          )}
          <button 
            onClick={handlePlay} 
            disabled={spinning || !sessionId || postGameCooldown > 0 || isBlocked} 
            className={`px-12 py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all shadow-lg ${
              spinning || !sessionId || postGameCooldown > 0 || isBlocked
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-gradient-to-r from-[#C4956A] to-[#A0714F] text-white hover:from-[#D5A578] hover:to-[#B07F5F] active:scale-95'
            }`}
          >
            {spinning ? '⏳ GIRANDO...' : isBlocked ? '⛔ RIPROVA DOMANI' : postGameCooldown > 0 ? `⏱️ RIPROVA TRA ${String(postGameCooldownTime.h).padStart(2,"0")}:${String(postGameCooldownTime.m).padStart(2,"0")}:${String(postGameCooldownTime.s).padStart(2,"0")}` : '▶️ GIRA IL VASETTO'}
          </button>
        </div>

        {/* Result feedback - shown inline */}
        {result && (
          <div className={`p-8 rounded-xl text-center font-bold shadow-lg border-2 ${
            result.won 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' 
              : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
          }`}>
            {result.won && prizeCode ? (
              <>
                <p className="text-5xl font-black text-green-700 mb-4">🎉 HAI VINTO! 🎉</p>
                {prizeInfo?.logo && (
                  <img src={prizeInfo.logo} alt={prizeInfo.sponsor} className="h-16 mx-auto my-4" />
                )}
                {prizeInfo?.sponsor && (
                  <p className="text-sm font-semibold text-gray-700 mb-2">{prizeInfo.sponsor}</p>
                )}
                {prizeInfo?.description && (
                  <p className="text-base font-bold mb-4 text-green-700">{prizeInfo.description}</p>
                )}
                <p className="text-base font-normal text-green-700 mb-2">✉️ Codice inviato via email!</p>
                <p className="text-xs text-gray-600">Controlla la posta (anche spam)</p>
              </>
            ) : result.won && !prizeCode ? (
              <>
                <p className="text-4xl font-black text-green-700 mb-2">🎉 COMPLIMENTI! 🎉</p>
                <p className="text-base font-normal text-gray-700">Codice premio in arrivo...</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-red-700 mb-2">😢 Peccato!</p>
                <p className="text-base font-normal text-gray-700 mb-2">Non era il vasetto giusto questa volta.</p>
                <p className="text-sm font-normal text-gray-600">Riprova domani!</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiPost, apiGet } from "@/lib/api";
import GameEmailGate from "@/components/game/GameEmailGate";
import PageWithAds from "@/components/ads/PageWithAds";
import { useFingerprint } from "@/hooks/useFingerprint";

/**
 * FORTUNA ITALIANA - Roulette with spinning animation
 * 3 slots with poem parts. Win: same poem + 3 parts (0,1,2) forming Italian flag colors
 */

export default function FortunaItaliana() {
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
  const [slots, setSlots] = useState([null, null, null]);
  const [spinningSlots, setSpinningSlots] = useState([null, null, null]); // For animation - store actual quartine texts
  const [result, setResult] = useState(null);
  const [prizeCode, setPrizeCode] = useState(null);
  const [prizeInfo, setPrizeInfo] = useState(null);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [postGameCooldown, setPostGameCooldown] = useState(0); // Cooldown after game ends
  const [postGameCooldownTime, setPostGameCooldownTime] = useState({ h: 0, m: 0, s: 0 });

  // Check cooldown when component mounts
  useEffect(() => {
    const checkCooldown = async () => {
      if (!email || phase !== "playing") return;
      
      try {
        const status = await apiGet('/api/v1/game-sessions/attempts-status', { email: email.toLowerCase(), gameType: 'fortuna_italiana', browserFingerprint: fingerprint });
        if (status.attemptsRemaining <= 0) {
          setCooldownMessage('Hai esaurito i tentativi di oggi');
          setPhase("blocked");
          return;
        }
        if (status.cooldownUntilMs && status.cooldownUntilMs > Date.now()) {
          const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
          setCooldownSeconds(secondsRemaining);
          setCooldownMessage(`Riprova tra ${secondsRemaining} secondi`);
          setPhase("blocked");
          
          // Countdown timer
          const interval = setInterval(() => {
            setCooldownSeconds(prev => {
              if (prev <= 1) {
                clearInterval(interval);
                setPhase("playing");
                setCooldownMessage(null);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } catch (err) {
        // Silently handle cooldown check failures
      }
    };
    
    checkCooldown();
  }, [email, phase, fingerprint]);

  // Format postGameCooldown for button display
  useEffect(() => {
    const diff = Math.max(0, postGameCooldown);
    setPostGameCooldownTime({
      h: Math.floor(diff / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    });
  }, [postGameCooldown]);

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
          const response = await apiGet('/api/v1/public/sponsors', { active: 'true', gameType: 'fortuna_italiana', limit: 1 });
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
    if (email) {
      if (sessionId && !sessionId.includes('pending')) {
        // Confirm email on existing session
        apiPost(`/api/v1/game-sessions/${sessionId}/confirm-email`, { 
          email,
          browserFingerprint: fingerprint
        })
          .then(res => { 
            setSponsor(res.sponsor); 
            setSessionId(res.sessionId); 
            setPhase("playing"); 
          })
          .catch(err => {
            if (err.status === 429) {
              if (err.data?.error?.retryAfterSeconds) {
                setGateErrorCooldown(err.data.error.retryAfterSeconds);
                setTimeout(() => setGateErrorCooldown(null), err.data.error.retryAfterSeconds * 1000);
              } else {
                alert('Hai esaurito i tentativi di oggi. Riprova domani!');
              }
            } else {
              alert('Errore nell\'avvio');
            }
            setEmail(null);
            setPhase("gate");
          });
      } else {
        // Create new session (old flow)
        apiPost('/api/v1/game-sessions/start', { 
          email, 
          gameType: 'fortuna_italiana',
          preferredSponsorId: previewSponsor?.id,
          browserFingerprint: fingerprint
        })
          .then(res => { setSponsor(res.sponsor); setSessionId(res.sessionId); setPhase("playing"); })
          .catch(err => {
            if (err.status === 429) {
              if (err.data?.error?.retryAfterSeconds) {
                setGateErrorCooldown(err.data.error.retryAfterSeconds);
                setTimeout(() => setGateErrorCooldown(null), err.data.error.retryAfterSeconds * 1000);
              } else {
                alert('Hai esaurito i tentativi di oggi. Riprova domani!');
              }
            } else {
              alert('Errore nell\'avvio');
            }
            setEmail(null);
            setPhase("gate");
          });
      }
    }
  }, [email, previewSponsor]);

  const handlePlay = async () => {
    if (!sessionId || spinning || phase !== "playing" || postGameCooldown > 0) return;
    
    // If this session is already completed, create a new one
    if (result !== null) {
      setSpinning(true);
      try {
        const newSessionRes = await apiPost('/api/v1/game-sessions/start', { 
          email: email.toLowerCase(), 
          gameType: 'fortuna_italiana',
          preferredSponsorId: sponsor?.id,
          browserFingerprint: fingerprint
        });
        setSessionId(newSessionRes.sessionId);
        setResult(null);
        setPrizeCode(null);
        setPrizeInfo(null);
        setSlots([null, null, null]);
        setPostGameCooldown(0);
        setSpinning(false);
        return; // Exit and let next click use new session
      } catch (err) {
        console.error('Error creating new session:', err);
        alert('Errore nella creazione della nuova partita');
        setSpinning(false);
        return;
      }
    }

    setSpinning(true);
    setResult(null);
    setPrizeCode(null);
    setPrizeInfo(null);
    setSpinningSlots([null, null, null]);
    
    try {
      // Call backend to get result and actual slots
      const response = await apiPost(`/api/v1/game-sessions/${sessionId}/fortune-italiana`);
      const finalSlots = response.slots || [null, null, null];
      
      // Generate random spinning animation with 5-8 iterations per slot
      const spinCount = 6;
      const spinDuration = 2800;
      const spinInterval = spinDuration / spinCount;
      
      // Pre-generate random slots for smooth animation
      const randomSlotsForAnimation = Array(spinCount).fill(null).map(() => [
        { partIndex: Math.floor(Math.random() * 3), partText: 'Quartina...' },
        { partIndex: Math.floor(Math.random() * 3), partText: 'Quartina...' },
        { partIndex: Math.floor(Math.random() * 3), partText: 'Quartina...' }
      ]);
      
      let animationStep = 0;
      const spinAnimInterval = setInterval(() => {
        if (animationStep < randomSlotsForAnimation.length) {
          setSpinningSlots(randomSlotsForAnimation[animationStep]);
          animationStep++;
        }
      }, spinInterval);
      
      // After animation, show final result and check cooldown
      setTimeout(async () => {
        clearInterval(spinAnimInterval);
        setSpinningSlots([null, null, null]);
        setSlots(finalSlots);
        setResult(response);
        
        // If won, generate prize
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
              console.error('Error generating prize:', err);
            }
          }, 500);
        }
        
        // Check cooldown from server immediately
        try {
          const status = await apiGet('/api/v1/game-sessions/attempts-status', { 
            email: email.toLowerCase(), 
            gameType: 'fortuna_italiana',
            browserFingerprint: fingerprint
          });
          
          if (status.cooldownUntilMs && status.cooldownUntilMs > Date.now()) {
            const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
            setPostGameCooldown(secondsRemaining);
            
            // Start countdown timer
            const interval = setInterval(() => {
              setPostGameCooldown(prev => {
                if (prev <= 1) {
                  clearInterval(interval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        } catch (err) {
          console.log('Could not check cooldown');
        }
        
        setSpinning(false);
      }, spinDuration);
    } catch (err) {
      console.error(err);
      if (err.status === 429 && email) {
        try {
          const status = await apiGet('/api/v1/game-sessions/attempts-status', { 
            email: email.toLowerCase(), 
            gameType: 'fortuna_italiana',
            browserFingerprint: fingerprint
          });
          if (status.attemptsRemaining <= 0) {
            setCooldownMessage('Hai esaurito i tentativi di oggi');
            setPhase("blocked");
          } else if (status.cooldownUntilMs && status.cooldownUntilMs > Date.now()) {
            const secondsRemaining = Math.ceil((status.cooldownUntilMs - Date.now()) / 1000);
            setPostGameCooldown(secondsRemaining);
          }
        } catch {
          // ignore
        }
      }
      alert(err.status === 429 ? 'Riprova più tardi' : 'Errore durante il gioco. Riprova.');
      setSpinning(false);
    }
  };

  const getSlotColor = (partIndex) => {
    // Italian flag colors: green (0), white (1), red (2)
    const colors = {
      0: 'bg-gradient-to-br from-green-400 to-green-600 border-2 border-green-700',
      1: 'bg-gradient-to-br from-gray-50 to-gray-200 border-2 border-gray-400',
      2: 'bg-gradient-to-br from-red-400 to-red-600 border-2 border-red-700'
    };
    return colors[partIndex] || 'bg-gray-400 border-2 border-gray-500';
  };

  const getSlotTextColor = (partIndex) => {
    return partIndex === 1 ? 'text-gray-900' : 'text-white';
  };

  // Show cooldown block screen
  if (phase === "blocked") {
    return (
      <PageWithAds hideAds={true}>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-red-600 mb-3">Riprova più tardi</h2>
            <p className="text-gray-600 mb-4">{cooldownMessage}</p>
            {cooldownSeconds > 0 && (
              <div className="text-3xl font-bold text-blue-600 mb-6">{cooldownSeconds}s</div>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Torna alla Home
            </button>
          </div>
        </div>
      </PageWithAds>
    );
  }

  if (phase === "gate") return <GameEmailGate sessionId={sessionId} gameTitle="🎰 Fortuna Italiana" prize={previewSponsor?.prizeDescription} sponsorName={previewSponsor?.name} sponsorLogo={previewSponsor?.logoUrl} fingerprint={fingerprint} cooldownSeconds={gateErrorCooldown} onEnter={(e) => { setEmail(e); }} />;

  return (
    <PageWithAds hideAds={true}>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-10">
            <p className="font-sans text-xs text-[#C4956A] uppercase tracking-widest mb-3">Gioco della Fortuna</p>
            <h1 className="text-4xl font-bold text-[#1C1C1C] mb-4">🎰 Slot Poetica</h1>
            <p className="text-sm text-gray-600">Vinci se i tre slot mostrano i colori della bandiera italiana</p>
          </div>

          {/* Instructions - More prominent */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-400 rounded-xl p-6 mb-8 shadow-md">
            <h3 className="font-bold text-amber-900 mb-4 text-center text-lg">📍 Come vincere:</h3>
            <div className="flex justify-around items-center mb-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-2 flex items-center justify-center text-3xl shadow-lg">🟢</div>
                <p className="text-sm font-bold text-green-700">Verde</p>
              </div>
              <div className="text-2xl font-bold text-gray-400">+</div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-300 border-2 border-gray-400 rounded-full mb-2 flex items-center justify-center text-3xl shadow-lg">⚪</div>
                <p className="text-sm font-bold text-gray-700">Bianco</p>
              </div>
              <div className="text-2xl font-bold text-gray-400">+</div>
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mb-2 flex items-center justify-center text-3xl shadow-lg">🔴</div>
                <p className="text-sm font-bold text-red-700">Rosso</p>
              </div>
            </div>
            <p className="text-xs text-center text-gray-600 italic">Fatto girare gli slot, vinci se escono 🟢 Verde, ⚪ Bianco, 🔴 Rosso!</p>
          </div>

          {/* Prize info - shown BEFORE playing */}
          {!result && sponsor && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 text-center">
              {sponsor.logoUrl && (
                <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 mx-auto mb-2" />
              )}
              <p className="text-sm font-normal text-gray-600 mb-1">Se vinci otterrai:</p>
              <p className="text-base font-bold text-blue-800">{sponsor.prizeDescription || 'un premio esclusivo'}</p>
            </div>
          )}

          <div className="flex justify-center gap-8 mb-12">
            {slots.map((slot, i) => {
              const displaySlot = slot || (spinningSlots[i] !== undefined && spinningSlots[i] !== null ? spinningSlots[i] : null);
              
              return (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className={`w-36 h-48 rounded-2xl border-4 flex items-center justify-center p-5 text-center overflow-hidden transition-all duration-300 shadow-lg ${
                    displaySlot ? getSlotColor(displaySlot.partIndex) : 'bg-gray-400 border-gray-500'
                  }`}>
                    {spinning && spinningSlots[i] !== undefined && spinningSlots[i] !== null ? (
                      // Spinning animation: show color-changing quartine text
                      <p className={`text-xs font-bold leading-snug line-clamp-9 animate-pulse ${getSlotTextColor(spinningSlots[i].partIndex)}`}>
                        {spinningSlots[i].partText}
                      </p>
                    ) : displaySlot && displaySlot.partText ? (
                      // Final result: show the actual poem part text
                      <p className={`text-xs font-bold leading-snug line-clamp-9 ${getSlotTextColor(displaySlot.partIndex)}`}>
                        {displaySlot.partText}
                      </p>
                    ) : (
                      <div className="text-5xl text-gray-300">?</div>
                    )}
                  </div>
                  <span className="font-sans text-sm font-bold text-[#333]">
                    {displaySlot?.partIndex === 0 && '🟢 Verde'}
                    {displaySlot?.partIndex === 1 && '⚪ Bianco'}
                    {displaySlot?.partIndex === 2 && '🔴 Rosso'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center mb-10">
            <button 
              onClick={handlePlay} 
              disabled={spinning || !sessionId || postGameCooldown > 0} 
              className={`px-12 py-4 rounded-xl font-bold text-lg uppercase tracking-wide transition-all shadow-lg ${
                spinning || !sessionId || postGameCooldown > 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 active:scale-95'
              }`}
            >
              {spinning ? '⏳ GIRANDO...' : postGameCooldown > 0 ? `⏱️ RIPROVA TRA ${String(postGameCooldownTime.h).padStart(2,"0")}:${String(postGameCooldownTime.m).padStart(2,"0")}:${String(postGameCooldownTime.s).padStart(2,"0")}` : '▶️ GIOCA'}
            </button>
          </div>

          {/* Result feedback */}
          {result && (
            <div className={`p-8 rounded-xl text-center font-bold shadow-lg border-2 ${
              result.won 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' 
                : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400'
            }`}>
              {result.won && prizeCode ? (
                <>
                  <p className="text-4xl font-black text-green-700 mb-3">🎉 HAI VINTO! 🎉</p>
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
                  <p className="text-2xl font-black text-red-700 mb-2">😢 Peccato!</p>
                  <p className="text-base font-normal text-gray-700">Non è andata bene questa volta.</p>
                  <p className="text-sm font-normal text-gray-600 mt-3">Riprova domani!</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWithAds>
  );
}

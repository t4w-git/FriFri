import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiPost, apiGet } from "@/lib/api";
import GameEmailGate from "@/components/game/GameEmailGate";
import GameCountdown from "@/components/game/GameCountdown";
import { useFingerprint } from "@/hooks/useFingerprint";

/**
 * GIOCO POESIE - Quiz format with timer
 * Backend controls: win logic, timeout enforcement, answer validation
 * Frontend display: Shows all feedback inline on same screen, NO separate screens
 */

export default function GiocoPoesie() {
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
  const [quiz, setQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [result, setResult] = useState(null);
  const [prizeCode, setPrizeCode] = useState(null);
  const [prizeInfo, setPrizeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [postGameCooldown, setPostGameCooldown] = useState(0);
  const [cooldownMessage, setCooldownMessage] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [postGameCooldownTime, setPostGameCooldownTime] = useState({ h: 0, m: 0, s: 0 });

  // Fetch sponsor from URL param or random one from email gate
  useEffect(() => {
    const fetchPreviewSponsor = async () => {
      try {
        if (sponsorIdFromUrl) {
          // If sponsor ID is in URL, fetch that specific sponsor
          const data = await apiGet(`/api/v1/public/sponsors/${sponsorIdFromUrl}`);
          setPreviewSponsor(data);
        } else if (sessionIdFromUrl) {
          // If sessionId is in URL, fetch session to get sponsor
          const session = await apiGet(`/api/v1/game-sessions/${sessionIdFromUrl}`);
          if (session.sponsor) {
            setPreviewSponsor(session.sponsor);
            setSponsor(session.sponsor);
          }
        } else {
          // Otherwise fetch random sponsor for this game
          const response = await apiGet('/api/v1/public/sponsors', { active: 'true', gameType: 'gioco_poesie', limit: 1 });
          if (response.data && response.data.length > 0) {
            setPreviewSponsor(response.data[0]);
          }
        }
      } catch (err) {
        // Silently handle sponsor fetch errors
      }
    };
    fetchPreviewSponsor();
  }, [sponsorIdFromUrl, sessionIdFromUrl]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || secondsLeft === null) return;
    
    if (secondsLeft <= 0) {
      setTimerActive(false);
      handleTimeout();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(s => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, secondsLeft]);

  useEffect(() => {
    if (email) {
      setLoading(true);
      // Se abbiamo sessionId da URL, carica il quiz direttamente
      // Altrimenti crea una nuova sessione
      const loadGame = async () => {
        try {
          if (sessionId && !sessionId.includes('pending')) {
            // Session already exists, confirm email and load quiz
            const confirmRes = await apiPost(`/api/v1/game-sessions/${sessionId}/confirm-email`, {
              email,
              browserFingerprint: fingerprint
            });
            setSponsor(confirmRes.sponsor);
            setSessionId(confirmRes.sessionId);

            const quizRes = await apiPost(`/api/v1/game-sessions/${confirmRes.sessionId}/load-quiz`);
            setQuiz(quizRes.questions);
            setTimeoutSeconds(quizRes.timeoutSeconds || 30);
            setSecondsLeft(quizRes.timeoutSeconds || 30);
            setTimerActive(true);
            setPhase("playing");
          } else {
            // Create new session (old flow without pre-reservation)
            const res = await apiPost('/api/v1/game-sessions/start', { 
              email, 
              gameType: 'gioco_poesie',
              preferredSponsorId: previewSponsor?.id,
              browserFingerprint: fingerprint
            });
            setSponsor(res.sponsor);
            setSessionId(res.sessionId);
            const quizRes = await apiPost(`/api/v1/game-sessions/${res.sessionId}/load-quiz`);
            setQuiz(quizRes.questions);
            setTimeoutSeconds(quizRes.timeoutSeconds || 30);
            setSecondsLeft(quizRes.timeoutSeconds || 30);
            setTimerActive(true);
            setPhase("playing");
          }
        } catch (err) {
          if (err.status === 429) {
            if (err.data?.error?.retryAfterSeconds) {
              setGateErrorCooldown(err.data.error.retryAfterSeconds);
              setTimeout(() => setGateErrorCooldown(null), err.data.error.retryAfterSeconds * 1000);
            } else {
              alert('Hai esaurito i tentativi di oggi. Riprova domani!');
            }
          } else {
            alert('Errore nel caricamento');
          }
          setEmail(null);
          setPhase("gate");
        } finally {
          setLoading(false);
        }
      };
      loadGame();
    }
  }, [email, fingerprint]);

  // Format postGameCooldown for button display
  useEffect(() => {
    const diff = Math.max(0, postGameCooldown);
    setPostGameCooldownTime({
      h: Math.floor(diff / 3600),
      m: Math.floor((diff % 3600) / 60),
      s: diff % 60,
    });
  }, [postGameCooldown]);

  const handleTimeout = async () => {
    if (!sessionId || selectedAnswer !== null) return;
    
    try {
      setSelectedAnswer(-1);
      setTimerActive(false);
      
      const response = await apiPost(`/api/v1/game-sessions/${sessionId}/answer-quiz`, {
        questionIndex: 0,
        selectedAnswerIndex: -1,
        isTimeout: true
      });

      setResult(response);
      
      // Check cooldown after game ends
      checkCooldownAfterGame();
    } catch (err) {
      setResult({ correct: false, won: false, message: 'Errore di connessione' });
    }
  };

  const checkCooldownAfterGame = async () => {
    if (!email) return;
    try {
      const status = await apiGet('/api/v1/game-sessions/attempts-status', { 
        email: email.toLowerCase(), 
        gameType: 'gioco_poesie',
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
        setCooldownMessage(`⏱️ RIPROVA TRA ${secondsRemaining}s`);
        
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
    } catch (err) {
      console.log('Could not check cooldown');
    }
  };

  const handleAnswer = async (index) => {
    if (!sessionId || selectedAnswer !== null || !timerActive) return;
    
    setSelectedAnswer(index);
    setTimerActive(false);

    try {
      const response = await apiPost(`/api/v1/game-sessions/${sessionId}/answer-quiz`, {
        questionIndex: 0,
        selectedAnswerIndex: index,
        isTimeout: false
      });

      setResult(response);

      // If won, generate prize after showing result for 2 seconds
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
        }, 2000);
      }

      // Check cooldown after game ends
      checkCooldownAfterGame();
    } catch (err) {
      if (err.status === 429) {
        checkCooldownAfterGame();
      }
      setResult({ correct: false, won: false, message: 'Errore di risposta' });
      setTimerActive(true);
      setSelectedAnswer(null);
    }
  };

  if (phase === "gate") return (
    <GameEmailGate 
      gameTitle="🎴 Gioco delle Poesie" 
      prize={previewSponsor?.prizeDescription || "Un premio esclusivo"}
      sponsorName={previewSponsor?.name}
      sponsorLogo={previewSponsor?.logoUrl}
      sessionId={sessionId}
      fingerprint={fingerprint}
      cooldownSeconds={gateErrorCooldown}
      onEnter={(e) => { setEmail(e); }} 
    />
  );

  if (loading || !quiz) return <div className="min-h-screen flex items-center justify-center text-[#999]">Caricamento...</div>;

  const question = quiz[0];
  const isAnswered = selectedAnswer !== null;
  const isCorrect = result?.correct || false;
  const isTimeout = selectedAnswer === -1;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <p className="font-sans text-xs text-[#C4956A] uppercase mb-3">Gioco delle Poesie</p>
          {/* Show title ONLY after answered */}
          {isAnswered && <h1 className="text-2xl font-bold text-[#1C1C1C]">{question.poemTitle}</h1>}
          {!isAnswered && <h1 className="text-2xl font-bold text-[#999]">???</h1>}
        </div>

        {/* Timer - hidden after answered */}
        {!isAnswered && (
          <div className="flex justify-center mb-8">
            <div className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center font-bold text-2xl transition-all ${
              secondsLeft <= 5 
                ? 'border-red-500 text-red-600 bg-red-50' 
                : 'border-[#C4956A] text-[#C4956A] bg-[#F9F6F0]'
            }`}>
              {secondsLeft}s
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E8DFD0] rounded-lg p-6 mb-8">
          {/* Prize info - shown BEFORE playing */}
          {!isAnswered && sponsor && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="text-center">
                {sponsor.logoUrl && (
                  <img src={sponsor.logoUrl} alt={sponsor.name} className="h-12 mx-auto mb-2" />
                )}
                <p className="text-sm font-normal text-gray-600 mb-1">Se rispondi correttamente vinci:</p>
                <p className="text-base font-bold text-blue-800">{sponsor.prizeDescription || 'un premio esclusivo'}</p>
              </div>
            </div>
          )}

          {/* Quartina display */}
          <div className="bg-[#F9F6F0] border-l-4 border-[#C4956A] p-4 mb-6 italic text-[#666] whitespace-pre-wrap">
            {question.quartina}
          </div>
          
          <p className="text-lg text-[#333] mb-6 font-medium">{question.question}</p>
          
          {/* Answer buttons */}
          <div className="space-y-3">
            {cooldownMessage && (
              <p className="text-sm text-center text-gray-600 mb-4">{cooldownMessage}</p>
            )}
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={isAnswered || !timerActive}
                className={`w-full p-4 rounded-lg border-2 font-medium transition-all text-left ${
                  !isAnswered && timerActive
                    ? 'border-[#E8DFD0] text-[#333] hover:border-[#C4956A] hover:bg-[#F9F6F0] cursor-pointer'
                    : selectedAnswer === i
                      ? isCorrect
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-red-500 bg-red-50 text-red-800'
                      : result?.correctAnswerIndex === i && isAnswered && !isCorrect
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-[#E8DFD0] text-[#999]'
                }`}
              >
                {selectedAnswer === i && isCorrect && '✓ '}
                {selectedAnswer === i && !isCorrect && '✗ '}
                {result?.correctAnswerIndex === i && isAnswered && !isCorrect && '✓ '}
                {option}
              </button>
            ))}
          </div>

          {/* Result feedback - shown inline on same screen */}
          {isAnswered && result && (
            <div className={`mt-6 p-4 rounded-lg text-center font-bold ${
              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result.won && prizeCode ? (
                <>
                  <p className="text-2xl">🎉 Hai vinto il premio!</p>
                  {prizeInfo?.logo && (
                    <img src={prizeInfo.logo} alt={prizeInfo.sponsor} className="h-16 mx-auto my-3" />
                  )}
                  {prizeInfo?.sponsor && (
                    <p className="text-sm font-normal mb-2">{prizeInfo.sponsor}</p>
                  )}
                  {prizeInfo?.description && (
                    <p className="text-sm font-normal mb-3 text-green-700">{prizeInfo.description}</p>
                  )}
                  <p className="text-sm font-normal text-green-700 mb-2">✉️ Codice inviato via email!</p>
                  <p className="text-xs text-gray-600">Controlla la posta (anche spam)</p>
                </>
              ) : result.won && !prizeCode ? (
                <p>🎉 Hai vinto! Codice premio in arrivo...</p>
              ) : isTimeout ? (
                <p>⏰ Tempo scaduto! Risposta non inviata!</p>
              ) : (
                <>
                  <p>✗ Risposta sbagliata! Hai perso!</p>
                  {result?.correctAnswerIndex !== undefined && (
                    <p className="text-sm mt-2">La risposta giusta era la {String.fromCharCode(65 + result.correctAnswerIndex)}</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

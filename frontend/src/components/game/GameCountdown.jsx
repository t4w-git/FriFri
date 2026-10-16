import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function GameCountdown({ secondsRemaining = null, showLabel = "Nuovo tentativo tra" }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      let diff;
      
      if (secondsRemaining !== null) {
        // If specific seconds are provided, use those
        diff = Math.max(0, secondsRemaining - Math.floor((Date.now() - (window.__countdownStartTime || Date.now())) / 1000));
      } else {
        // Otherwise, calculate time until midnight (original behavior)
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        diff = Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
      }
      
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    
    if (secondsRemaining !== null) {
      window.__countdownStartTime = Date.now();
    }
    
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  return (
    <div className="mt-8 inline-flex items-center gap-3 bg-[#F5EFE4] rounded-2xl px-6 py-4">
      <Clock className="w-4 h-4 text-[#C4956A]" />
      <span className="font-sans text-sm text-[#777]">{showLabel}</span>
      <span className="font-mono font-bold text-[#1C1C1C]">
        {String(timeLeft.h).padStart(2,"0")}:{String(timeLeft.m).padStart(2,"0")}:{String(timeLeft.s).padStart(2,"0")}
      </span>
    </div>
  );
}
import { Trophy } from "lucide-react";
import GameCountdown from "./GameCountdown";

export default function PrizeWinScreen({ prizeCode, sponsor, email, score, total }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl mb-6">🎉</div>
        <h1 className="text-4xl font-bold text-[#1C1C1C] mb-3">Hai vinto!</h1>
        {score !== undefined && total !== undefined && (
          <p className="font-sans text-[#777] mb-8">Hai risposto correttamente a {score} su {total} domande.</p>
        )}
        {score === undefined && (
          <p className="font-sans text-[#777] mb-8">Complimenti! Hai guadagnato il premio di questa settimana.</p>
        )}

        <div className="bg-[#F5EFE4] rounded-2xl p-6 mb-4 border border-[#E8DFD0]">
          <Trophy className="w-8 h-8 text-[#C4956A] mx-auto mb-3" />
          <p className="font-sans text-sm text-[#999] mb-3">🎁 Il codice premio</p>
          <p className="font-sans text-base text-[#333] mb-4 font-semibold">
            ti è stato inviato via email
          </p>

          <div className="bg-white rounded-lg p-3 mb-4 border border-[#E8DFD0]">
            <p className="font-sans text-xs text-[#999] mb-1">Controlla lo spam se non lo vedi</p>
            <p className="font-mono text-sm text-[#C4956A] font-semibold break-all">{email}</p>
          </div>

          <p className="font-sans text-xs text-[#777] mb-2">
            Premi il bottone di riscatto <strong>solo quando ti rechi a ritirare il premio</strong> presso:
          </p>
          <p className="font-sans text-sm font-semibold text-[#555]">
            {sponsor?.name || "lo sponsor locale"}
          </p>
        </div>
        <GameCountdown />
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, AlertCircle, Loader2, Home, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const API_URL = '';

export default function ClaimPrize() {
  const { prizeCode } = useParams();
  const navigate = useNavigate();
  const [claimData, setClaimData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    const fetchClaimData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_URL}/api/v1/game-sessions/verify/claim?prizeCode=${encodeURIComponent(prizeCode)}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || 'Prize code not found');
        }

        const data = await response.json();
        setClaimData(data);
        setRedeemed(data.redeemed || false);
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to verify prize code');
        setClaimData(null);
      } finally {
        setLoading(false);
      }
    };

    if (prizeCode) {
      fetchClaimData();
    }
  }, [prizeCode]);

  const handleRedeem = async () => {
    try {
      setRedeeming(true);
      const response = await fetch(
        `${API_URL}/api/v1/prize-codes/code/${prizeCode}/redeem`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: claimData.playerEmail })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to redeem prize');
      }

      setRedeemed(true);
    } catch (err) {
      setError(err.message || 'Failed to redeem prize');
    } finally {
      setRedeeming(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGameTypeLabel = (gameType) => {
    const labels = {
      'poesie': 'Gioco Poesie',
      'fortuna-italiana': 'Fortuna Italiana',
      'fortuna-montelupo': 'Fortuna Montelupo'
    };
    return labels[gameType] || gameType;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#C4956A] mx-auto mb-4 animate-spin" />
          <p className="text-[#777] font-sans">Verifica premio in corso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-[#C4956A] hover:bg-[#B08556] text-white font-sans flex items-center justify-center py-2 rounded"
          >
            <Home className="w-4 h-4 mr-2" />
            Torna alla home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#FBF9F6] to-white">
      <div className="max-w-md w-full">
        {claimData && (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-[#1C1C1C] mb-2">
                Premio Verificato
              </h1>
              <p className="text-[#777] font-sans text-sm">
                Mostra questa schermata al negoziante per ritirare il tuo premio
              </p>
            </div>

            {/* Prize Code */}
            <div className="bg-[#F5EFE4] rounded-2xl p-6 mb-6 border border-[#E8DFD0]">
              <Trophy className="w-8 h-8 text-[#C4956A] mx-auto mb-3" />
              
              <div className="text-center mb-6">
                <p className="font-sans text-xs text-[#999] mb-2 uppercase tracking-wider">
                  Codice Premio
                </p>
                <p className="text-2xl font-mono font-bold text-[#C4956A] tracking-widest">
                  {claimData.prizeCode}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-[#E8DFD0] my-4 opacity-50"></div>

              {/* Details */}
              <div className="space-y-3">
                {/* Game Type */}
                <div className="text-center">
                  <p className="font-sans text-xs text-[#999] mb-1">Gioco</p>
                  <p className="text-sm font-semibold text-[#555]">
                    {getGameTypeLabel(claimData.gameType)}
                  </p>
                </div>

                {/* Date */}
                <div className="text-center">
                  <p className="font-sans text-xs text-[#999] mb-1">Data e Ora</p>
                  <p className="text-sm font-semibold text-[#555]">
                    {formatDate(claimData.playedDate)}
                  </p>
                </div>

                {/* Sponsor */}
                {claimData.sponsor && (
                  <div className="text-center">
                    <p className="font-sans text-xs text-[#999] mb-1">Sponsor</p>
                    <p className="text-sm font-semibold text-[#555]">
                      {claimData.sponsor.name}
                    </p>
                  </div>
                )}

                {/* Prize Description */}
                {claimData.sponsor?.prize_description && (
                  <div className="text-center pt-2">
                    <p className="font-sans text-xs text-[#999] mb-1">Premio</p>
                    <p className="text-sm text-[#555] font-medium">
                      {claimData.sponsor.prize_description}
                    </p>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="border-t border-[#E8DFD0] my-4 opacity-50"></div>
              <p className="font-sans text-xs text-[#999] text-center">
                Codice inviato a:{' '}
                <span className="text-[#555] font-semibold">
                  {claimData.playerEmail}
                </span>
              </p>
            </div>

            {/* Info Box */}
            <Alert className="border-[#E8DFD0] bg-[#F5EFE4] mb-6">
              <AlertCircle className="h-4 w-4 text-[#C4956A] mr-2" />
              <AlertDescription className="text-[#666] text-sm font-sans">
                {redeemed ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Premio riscattato con successo!
                  </span>
                ) : (
                  "Clicca il bottone sottostante per riscattare il premio"
                )}
              </AlertDescription>
            </Alert>

            {/* Redeem Button */}
            {!redeemed && (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="w-full bg-[#C4956A] hover:bg-[#B08556] text-white font-sans py-2 rounded-lg flex items-center justify-center"
              >
                {redeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Riscattando...
                  </>
                ) : (
                  "Riscatta Premio"
                )}
              </button>
            )}

            {redeemed && (
              <button
                onClick={() => navigate('/')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-sans py-2 rounded-lg flex items-center justify-center"
              >
                <Home className="w-4 h-4 mr-2" />
                Torna alla home
              </button>
            )}

            {!redeemed && (
              <button
                onClick={() => navigate('/')}
                className="w-full border border-[#E8DFD0] text-[#666] hover:bg-[#F5EFE4] font-sans py-2 rounded-lg flex items-center justify-center mt-2"
              >
                <Home className="w-4 h-4 mr-2" />
                Torna alla home
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

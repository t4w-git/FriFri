import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { Settings, Save, X } from 'lucide-react';

const GAMES = [
  { id: 'fortuna_italiana', label: '🎰 Fortuna Italiana', icon: '🎰' },
  { id: 'fortuna_montelupo', label: '🏺 Fortuna Montelupo', icon: '🏺' },
  { id: 'gioco_poesie', label: '🎴 Gioco delle Poesie', icon: '🎴' }
];

export default function AdminGameConfig() {
  const [activeGame, setActiveGame] = useState('fortuna_italiana');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load config when game changes
  useEffect(() => {
    loadConfig(activeGame);
  }, [activeGame]);

  const loadConfig = async (gameType) => {
    setLoading(true);
    try {
      const data = await apiGet(`/api/v1/admin/game-configs/${gameType}`);
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      // Set default config if not found
      setConfig(getDefaultConfig(gameType));
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (gameType) => {
    const base = {
      gameType,
      attemptsPerDay: 5,
      cooldownMinutes: 5,
      dailyResetHour: 0,
      active: true,
      winEveryXAttempts: 3
    };
    
    if (gameType === 'gioco_poesie') {
      return {
        ...base,
        questionsPerGame: 1,
        questionsToWin: 1,
        difficulty: 'facile',
        questionsTimeoutSeconds: 30
      };
    }
    return base;
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const method = config.id ? 'PUT' : 'POST';
      const endpoint = config.id 
        ? `/api/v1/admin/game-config/${config.id}`
        : `/api/v1/admin/game-config`;
      
      const response = method === 'PUT' 
        ? await apiPut(endpoint, config)
        : await apiPost(endpoint, config);
      
      setConfig(response);
      alert('✅ Configurazione salvata');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('❌ Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    const updated = { ...config, [field]: value };
    
    // Auto-sync: Formula is attemptsPerDay = 1440 (min in day) / cooldownMinutes
    if (field === 'attemptsPerDay' && value > 0) {
      // If user changes attempts, calculate cooldown
      updated.cooldownMinutes = Math.round(1440 / value);
    } else if (field === 'cooldownMinutes' && value > 0) {
      // If user changes cooldown, calculate attempts
      updated.attemptsPerDay = Math.round(1440 / value);
    }
    
    setConfig(updated);
  };

  const currentGame = GAMES.find(g => g.id === activeGame);

  return (
    <div className="space-y-6">
      {/* Game Selector */}
      <div className="flex gap-2 flex-wrap">
        {GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeGame === game.id
                ? 'bg-[#C4956A] text-white'
                : 'bg-[#F5EFE4] text-[#1C1C1C] hover:bg-[#E8DFD0]'
            }`}
          >
            {game.icon} {game.label}
          </button>
        ))}
      </div>

      {/* Config Form */}
      {loading ? (
        <div className="text-center py-8 text-[#999]">Caricamento...</div>
      ) : config ? (
        <div className="bg-white border border-[#E8DFD0] rounded-lg p-6 space-y-6">
          <h3 className="text-lg font-bold text-[#1C1C1C] flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurazione: {currentGame?.label}
          </h3>

          {/* Common Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Tentativi per giorno
              </label>
              <input
                type="number"
                value={config.attemptsPerDay}
                onChange={e => handleChange('attemptsPerDay', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
                min="1"
                max="1440"
              />
              <p className="text-xs text-[#999] mt-1">
                Cooldown automatico: {config.cooldownMinutes >= 60 
                  ? `${Math.floor(config.cooldownMinutes / 60)}h ${config.cooldownMinutes % 60}m`
                  : `${config.cooldownMinutes}m`}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Cooldown tra partite
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="number"
                    value={config.cooldownMinutes}
                    onChange={e => handleChange('cooldownMinutes', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
                    min="0"
                    max="1440"
                  />
                </div>
                <span className="text-sm text-[#999] whitespace-nowrap flex items-center px-2">
                  {config.cooldownMinutes >= 60 
                    ? `${Math.floor(config.cooldownMinutes / 60)}h ${config.cooldownMinutes % 60}m`
                    : `${config.cooldownMinutes}m`}
                </span>
              </div>
              <p className="text-xs text-[#999] mt-1">
                Tentativi automatici: {config.attemptsPerDay}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Reset giornaliero (ora UTC)
              </label>
              <input
                type="number"
                value={config.dailyResetHour}
                onChange={e => handleChange('dailyResetHour', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
                min="0"
                max="23"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#666] mb-2">
                Stato
              </label>
              <select
                value={config.active ? 'true' : 'false'}
                onChange={e => handleChange('active', e.target.value === 'true')}
                className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
              >
                <option value="true">Attivo</option>
                <option value="false">Inattivo</option>
              </select>
            </div>
          </div>

          {/* Win Rate Config - Per Fortuna Italiana e Montelupo */}
          {(activeGame === 'fortuna_italiana' || activeGame === 'fortuna_montelupo') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h4 className="font-bold text-blue-900">⚖️ Configurazione Vincita</h4>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-2">
                  1 vincita ogni quante partite?
                </label>
                <p className="text-xs text-blue-700 mb-2">
                  Esempio: Se metti 3, il giocatore vince 1 partita ogni ~3 tentativi
                </p>
                <input
                  type="number"
                  value={config.winEveryXAttempts}
                  onChange={e => handleChange('winEveryXAttempts', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-blue-700 mt-2">
                  📊 Win rate: {Math.round(100 / config.winEveryXAttempts)}%
                </p>
              </div>
            </div>
          )}

          {/* Gioco Poesie Specific Config */}
          {activeGame === 'gioco_poesie' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
              <h4 className="font-bold text-purple-900">❓ Configurazione Quiz</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Domande per partita
                  </label>
                  <input
                    type="number"
                    value={config.questionsPerGame}
                    onChange={e => handleChange('questionsPerGame', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    min="1"
                    max="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Risposte corrette per vincere
                  </label>
                  <input
                    type="number"
                    value={config.questionsToWin}
                    onChange={e => handleChange('questionsToWin', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    min="1"
                    max={config.questionsPerGame}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
                    Tempo per rispondere (secondi)
                  </label>
                  <input
                    type="number"
                    value={config.questionsTimeoutSeconds || 30}
                    onChange={e => handleChange('questionsTimeoutSeconds', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    min="5"
                    max="120"
                  />
                </div>
              </div>


            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#666] mb-2">
              Note/Descrizione
            </label>
            <textarea
              value={config.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-[#E8DFD0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4956A]"
              rows="3"
              placeholder="Note interne sulla configurazione..."
            />
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              <Save className="w-4 h-4" />
              Salva Configurazione
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

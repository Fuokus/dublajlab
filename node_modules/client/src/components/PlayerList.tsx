import type { Player } from '../types';

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string | null;
  showCharacter?: boolean;
}

export default function PlayerList({ players, currentPlayerId, showCharacter = false }: PlayerListProps) {
  return (
    <div className="space-y-3">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 ${
            player.id === currentPlayerId
              ? 'bg-accent/10 border border-accent/30 shadow-[0_0_15px_rgba(45,212,168,0.1)]'
              : 'bg-white/5 border border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.nickname}
                className={`w-10 h-10 rounded-full shadow-lg ${
                  player.isHost ? 'ring-2 ring-warning/50' : player.id === currentPlayerId ? 'ring-2 ring-accent/50' : 'opacity-80'
                }`}
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${
                  player.isHost
                    ? 'bg-warning/20 text-warning border border-warning/30'
                    : 'bg-white/10 text-white border border-white/20'
                }`}
              >
                {player.nickname.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-gray-200">{player.nickname}</span>
                {player.isHost && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/20 text-warning font-bold uppercase tracking-wider border border-warning/30">
                    Host
                  </span>
                )}
                {player.id === currentPlayerId && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-accent/20 text-accent font-bold uppercase tracking-wider border border-accent/30">
                    Sen
                  </span>
                )}
              </div>

              {showCharacter && player.character && (
                <div className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mt-1">
                  <span className="w-4 h-4 rounded bg-white/5 flex items-center justify-center text-[10px]">🎭</span>
                  {player.character.name}
                </div>
              )}
            </div>
          </div>

          {/* Durum */}
          <div className="pl-2">
            {player.isReady ? (
              <span className="badge-success shadow-lg shadow-success/20">Hazır ✓</span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10">Bekliyor</span>
            )}
          </div>
        </div>
      ))}

      {players.length === 0 && (
        <div className="text-center bg-white/5 border border-white/10 rounded-xl p-6 text-sm">
          <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-2">👥</div>
          <p className="text-gray-400 font-medium">Henüz oyuncu yok</p>
        </div>
      )}
    </div>
  );
}

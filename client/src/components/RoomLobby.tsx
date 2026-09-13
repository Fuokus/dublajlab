import { useState, useEffect } from 'react';
import PlayerList from './PlayerList';
import SceneSelector from './SceneSelector';
import { fetchScenes } from '../utils/api';
import type { Room, Scene } from '../types';

interface RoomLobbyProps {
  room: Room;
  playerId: string;
  onSelectScene: (sceneId: string) => void;
  onToggleReady: (isReady: boolean) => void;
  onStartGame: () => void;
  onLeave: () => void;
  error: string | null;
}

export default function RoomLobby({
  room,
  playerId,
  onSelectScene,
  onToggleReady,
  onStartGame,
  onLeave,
  error,
}: RoomLobbyProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(true);
  const [copied, setCopied] = useState(false);

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  useEffect(() => {
    fetchScenes()
      .then(setScenes)
      .catch((err) => console.error('Sahne yükleme hatası:', err))
      .finally(() => setLoadingScenes(false));
  }, []);

  const copyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/?room=${room.code}`;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = inviteLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const canStartGame = isHost && room.sceneId && room.players.length >= 1;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-ambient">
      <div className="max-w-4xl mx-auto animate-fade-in relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DublajLab" className="w-9 h-9 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-white">
                Dublaj<span className="text-accent">Lab</span>
              </h1>
              <p className="text-gray-500 text-xs">Oda Lobisi</p>
            </div>
          </div>
          <button onClick={onLeave} className="btn-secondary text-sm py-2 px-4">
            Ayrıl
          </button>
        </div>

        {/* Hata */}
        {error && (
          <div className="mb-5 p-3 rounded-xl text-danger text-sm animate-slide-up"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            {error}
          </div>
        )}

        {/* Oda kodu kartı */}
        <div className="card-glass mb-6 text-center">
          <p className="text-xs text-gray-400 mb-3 uppercase tracking-widest">Oda Kodu</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold tracking-[0.3em] text-white"
              style={{ textShadow: '0 0 20px rgba(45, 212, 168, 0.3)' }}>
              {room.code}
            </span>
            <button
              onClick={copyInviteLink}
              className="p-2.5 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              title="Davet Linkini Kopyala"
            >
              {copied ? (
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">Bu kodu arkadaşlarınla paylaş</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol: Oyuncu Listesi */}
          <div className="card-glass">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                style={{ background: 'rgba(45, 212, 168, 0.15)' }}>👥</span>
              Oyuncular ({room.players.length})
            </h2>
            <PlayerList players={room.players} currentPlayerId={playerId} />

            {/* Hazır butonu */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {currentPlayer && (
                <button
                  onClick={() => onToggleReady(!currentPlayer.isReady)}
                  className={`w-full text-sm py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                    currentPlayer.isReady
                      ? 'text-accent hover:text-gray-300'
                      : 'btn-success'
                  }`}
                  style={currentPlayer.isReady ? {
                    background: 'rgba(45, 212, 168, 0.1)',
                    border: '1px solid rgba(45, 212, 168, 0.2)'
                  } : {}}
                >
                  {currentPlayer.isReady ? '✓ Hazırım (İptal Et)' : 'Hazırım'}
                </button>
              )}
            </div>
          </div>

          {/* Sağ: Sahne Seçimi */}
          <div className="card-glass">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                style={{ background: 'rgba(45, 212, 168, 0.15)' }}>🎬</span>
              Sahne Seçimi
              {!isHost && <span className="text-xs text-gray-500 font-normal">(Sadece host seçebilir)</span>}
            </h2>

            {loadingScenes ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 rounded-full animate-spin"
                  style={{ border: '2px solid rgba(45, 212, 168, 0.1)', borderTopColor: '#2dd4a8' }} />
              </div>
            ) : (
              <SceneSelector
                scenes={scenes}
                selectedSceneId={room.sceneId}
                onSelect={onSelectScene}
                disabled={!isHost}
              />
            )}
          </div>
        </div>

        {/* Başlat butonu (sadece host) */}
        {isHost && (
          <div className="mt-8 text-center">
            <button
              id="start-game-btn"
              onClick={onStartGame}
              disabled={!canStartGame}
              className="btn-primary text-lg px-12 py-4 font-bold"
            >
              <span className="flex items-center justify-center gap-2">
                🎙️ Oyunu Başlat
              </span>
            </button>
            {!room.sceneId && (
              <p className="text-xs text-gray-500 mt-3">Önce bir sahne seçin</p>
            )}
          </div>
        )}

        {!isHost && (
          <div className="mt-8 text-center text-gray-500 text-sm">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
              Host'un oyunu başlatmasını bekleyin...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

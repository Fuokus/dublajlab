import { useState, useMemo } from 'react';
import VideoPlayer from './VideoPlayer';
import DialogueRecorder from './DialogueRecorder';
import PlayerList from './PlayerList';
import { startRender, API_URL } from '../utils/api';
import type { Room, Dialogue } from '../types';

interface GameScreenProps {
  room: Room;
  playerId: string;
  onRecordingComplete: (dialogueId: string) => void;
  error: string | null;
}

export default function GameScreen({ room, playerId, onRecordingComplete, error }: GameScreenProps) {
  const [renderStarting, setRenderStarting] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [completedDialogues, setCompletedDialogues] = useState<Set<string>>(new Set());

  const currentPlayer = room.players.find((p) => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  // Bu oyuncunun karakteri ve replikleri
  const myCharacter = currentPlayer?.character;

  // Tüm oyuncuların karakterleri ve replikleri (toplam kayıt sayısını hesaplamak için)
  const allDialogues = useMemo(() => {
    if (!room.scene) return [];
    return room.scene.characters.flatMap((c) => c.dialogues);
  }, [room.scene]);

  // NORMAL MOD: Sadece kendi karakterinin repliklerini kaydet
  const myDialogues: Dialogue[] = myCharacter?.dialogues 
    ? [...myCharacter.dialogues].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const totalDialogues = allDialogues.length;
  const allMyDialoguesComplete = myDialogues.length > 0 && myDialogues.every((d) => completedDialogues.has(d.id));

  const handleRecordingComplete = (dialogueId: string) => {
    setCompletedDialogues((prev) => new Set([...prev, dialogueId]));
    onRecordingComplete(dialogueId);
  };

  const handleStartRender = async () => {
    try {
      setRenderStarting(true);
      setRenderError(null);
      await startRender(room.id);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'Video oluşturulurken bir hata oluştu');
    } finally {
      setRenderStarting(false);
    }
  };

  const videoSrc = room.scene?.videoPath ? `${API_URL}/${room.scene.videoPath}` : '';

  return (
    <div className="min-h-screen p-4 md:p-6 bg-ambient">
      <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="DublajLab" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Dublaj<span className="text-accent">Lab</span>
              </h1>
              <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1.5">
                <span className="text-gray-300 font-medium">{room.scene?.name}</span> 
                <span className="w-1 h-1 rounded-full bg-gray-600"></span> 
                <span>Oda: <span className="text-gray-400 uppercase tracking-widest">{room.code}</span></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {allMyDialoguesComplete && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Kayıtlarım Tamamlandı
              </span>
            )}
          </div>
        </div>

        {/* Hata */}
        {(error || renderError) && (
          <div className="mb-6 p-4 rounded-xl text-danger text-sm animate-slide-up"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            {error || renderError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol: Video + Oyuncular */}
          <div className="lg:col-span-4 space-y-5">
            {/* Video oynatıcı */}
            {videoSrc && (
              <div className="card-glass p-4 sticky top-6">
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                      style={{ background: 'rgba(45, 212, 168, 0.15)' }}>👁️</span>
                    Sahne Videosu
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded text-gray-400 bg-white/5 border border-white/10">Sessiz</span>
                </div>
                <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                  <VideoPlayer src={videoSrc} muted={true} />
                </div>
              </div>
            )}

            {/* Oyuncu listesi */}
            <div className="card-glass">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                  style={{ background: 'rgba(45, 212, 168, 0.15)' }}>👥</span>
                Oyuncular
              </h3>
              <PlayerList players={room.players} currentPlayerId={playerId} showCharacter={true} />
            </div>

            {/* Host: Render butonu */}
            {isHost && (
              <div className="card-glass text-center p-5">
                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                  style={{ background: 'rgba(45, 212, 168, 0.1)' }}>
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </div>
                <h3 className="font-medium text-white mb-1">Final Videosu</h3>
                <p className="text-xs text-gray-400 mb-4 px-2">Tüm oyuncular kayıtlarını tamamladığında videoyu oluşturabilirsiniz.</p>
                
                <button
                  id="start-render-btn"
                  onClick={handleStartRender}
                  disabled={renderStarting}
                  className="btn-primary w-full text-sm py-3.5 flex items-center justify-center gap-2"
                >
                  {renderStarting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-black/60" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Oluşturuluyor...
                    </>
                  ) : (
                    '🎬 Final Videoyu Oluştur'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sağ: Replik kayıtları */}
          <div className="lg:col-span-8 space-y-5">
            <div className="card-glass p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: 'rgba(45, 212, 168, 0.15)' }}>🎙️</span>
                  Kayıt Stüdyosu
                </h2>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs text-gray-400">Tamamlanan:</span>
                  <span className="text-sm font-semibold text-accent">{completedDialogues.size}</span>
                  <span className="text-xs text-gray-600">/</span>
                  <span className="text-xs text-gray-500">{myDialogues.length}</span>
                </div>
              </div>
            </div>

            {myDialogues.length === 0 ? (
              <div className="card-glass py-16 text-center">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  🎭
                </div>
                <p className="text-gray-300 font-medium mb-1">
                  {myCharacter
                    ? 'Bu karakter için replik bulunmuyor.'
                    : 'Sana karakter atanmadı.'}
                </p>
                <p className="text-gray-500 text-sm">
                  Diğer oyuncuların kayıtlarını bekleyebilirsin.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myDialogues.map((dialogue) => (
                  <DialogueRecorder
                    key={dialogue.id}
                    dialogue={dialogue}
                    playerId={playerId}
                    roomId={room.id}
                    characterName={room.scene!.characters.find((c) => c.id === dialogue.characterId)?.name || 'Bilinmiyor'}
                    onRecordingComplete={handleRecordingComplete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

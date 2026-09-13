import { useState } from 'react';
import { useRecorder } from '../hooks/useRecorder';
import { uploadRecording } from '../utils/api';
import type { Dialogue, RecordingStatus } from '../types';

interface DialogueRecorderProps {
  dialogue: Dialogue;
  playerId: string;
  roomId: string;
  characterName: string;
  onRecordingComplete: (dialogueId: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

export default function DialogueRecorder({
  dialogue,
  playerId,
  roomId,
  characterName,
  onRecordingComplete,
}: DialogueRecorderProps) {
  const { isRecording, audioBlob, audioUrl, duration, error, startRecording, stopRecording, clearRecording } =
    useRecorder();
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const expectedDuration = dialogue.endTime - dialogue.startTime;

  const handleUpload = async () => {
    if (!audioBlob) return;

    try {
      setStatus('uploading');
      setUploadError(null);

      await uploadRecording(audioBlob, dialogue.id, playerId, roomId, duration);

      setStatus('uploaded');
      onRecordingComplete(dialogue.id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Kayıt yüklenemedi');
      setStatus('recorded');
    }
  };

  const handleReRecord = () => {
    clearRecording();
    setStatus('idle');
    setUploadError(null);
  };

  const handleStartRecording = async () => {
    setUploadError(null);
    await startRecording();
    setStatus('recording');
  };

  const handleStopRecording = async () => {
    await stopRecording();
    setStatus('recorded');
  };

  const durationWarning = status === 'recorded' && duration > expectedDuration + 0.5;

  return (
    <div
      className={`card-glass transition-all duration-300 relative overflow-hidden ${
        isRecording
          ? 'border-danger shadow-[0_0_20px_rgba(239,68,68,0.3)]'
          : status === 'uploaded'
            ? 'border-success shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'hover:border-white/20'
      }`}
    >
      {/* Background glow if recording */}
      {isRecording && (
        <div className="absolute inset-0 bg-danger/5 animate-pulse pointer-events-none" />
      )}

      {/* Replik bilgisi */}
      <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-accent/20 flex items-center justify-center text-xs">🎭</span>
              {characterName}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span className="text-[10px] font-mono text-gray-400 bg-black/30 px-2 py-0.5 rounded border border-white/5">
              {formatDuration(dialogue.startTime)} - {formatDuration(dialogue.endTime)}
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-200 font-medium leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
            "{dialogue.text}"
          </p>
        </div>

        {/* Durum badge */}
        <div className="flex-shrink-0 pt-1">
          {status === 'uploaded' && <span className="badge-success shadow-lg shadow-success/20">Kaydedildi ✓</span>}
          {status === 'uploading' && <span className="badge-warning">Yükleniyor...</span>}
          {status === 'recording' && (
            <span className="badge-danger flex items-center gap-2 shadow-lg shadow-danger/30">
              <span className="w-2 h-2 rounded-full bg-white recording-dot" />
              Kayıt
            </span>
          )}
          {status === 'recorded' && <span className="badge-accent shadow-lg shadow-accent/20">Hazır</span>}
          {status === 'idle' && <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/10">Bekliyor</span>}
        </div>
      </div>

      {/* Hata mesajları */}
      {(error || uploadError) && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm relative z-10">
          {error || uploadError}
        </div>
      )}

      {/* Süre uyarısı */}
      {durationWarning && (
        <div className="mb-4 p-3 rounded-xl bg-warning/10 border border-warning/20 text-warning text-sm flex gap-3 items-start relative z-10">
          <span className="text-warning text-lg leading-none">⚠️</span>
          <div>
            <p className="font-medium mb-0.5">Süre Sınırı Aşıldı</p>
            <p className="text-xs opacity-80">Kayıt süresi ({duration.toFixed(1)}s) beklenen süreden ({expectedDuration.toFixed(1)}s) uzun. Taşan kısım kesilecektir.</p>
          </div>
        </div>
      )}

      {/* Kayıt süresi göstergesi */}
      {(isRecording || status === 'recorded') && (
        <div className="mb-5 relative z-10">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
              Kayıt Süresi
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold ${isRecording ? 'text-danger' : 'text-white'}`}>
                {formatDuration(duration)}
              </span>
              <span className="text-gray-600">/</span>
              <span className="font-mono text-gray-500">{expectedDuration.toFixed(1)}s</span>
            </div>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
            <div
              className={`absolute top-0 left-0 h-full rounded-full transition-all duration-200 ${
                isRecording ? 'bg-danger animate-pulse' : durationWarning ? 'bg-warning' : 'bg-accent'
              }`}
              style={{
                width: `${Math.min(100, (duration / expectedDuration) * 100)}%`,
                boxShadow: isRecording ? '0 0 10px rgba(239,68,68,0.5)' : 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Ses önizleme */}
      {audioUrl && !isRecording && (
        <div className="mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-black/40 border border-white/10">
            <audio src={audioUrl} controls className="w-full h-10 opacity-90" style={{ filter: 'invert(1) hue-rotate(180deg) brightness(1.2) contrast(1.2)' }} />
          </div>
        </div>
      )}

      {/* Kontrol butonları */}
      <div className="flex items-center gap-3 relative z-10">
        {status === 'idle' && (
          <button onClick={handleStartRecording} className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 shadow-[0_0_20px_rgba(45,212,168,0.2)]">
            <div className="w-4 h-4 rounded-full bg-black/80 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-accent"></div>
            </div>
            Kayda Başla
          </button>
        )}

        {isRecording && (
          <button onClick={handleStopRecording} className="btn-danger flex-1 flex items-center justify-center gap-2 py-3 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
            <div className="w-3 h-3 bg-white rounded-sm"></div>
            Kaydı Durdur
          </button>
        )}

        {status === 'recorded' && (
          <>
            <button onClick={handleUpload} className="btn-success flex-1 flex items-center justify-center gap-2 py-3 text-sm shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Onayla ve Yükle
            </button>
            <button onClick={handleReRecord} className="btn-secondary flex items-center justify-center gap-2 py-3 px-5 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tekrar
            </button>
          </>
        )}

        {status === 'uploading' && (
          <div className="flex-1 flex items-center justify-center gap-3 py-3 text-sm font-medium text-warning bg-warning/10 rounded-xl border border-warning/20">
            <div className="w-4 h-4 rounded-full border-2 border-warning/30 border-t-warning animate-spin"></div>
            Yükleniyor...
          </div>
        )}

        {status === 'uploaded' && (
          <button onClick={handleReRecord} className="btn-secondary flex-1 flex items-center justify-center gap-2 py-3 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Yeniden Kaydet
          </button>
        )}
      </div>
    </div>
  );
}

import type { RenderProgress } from '../types';
import { API_URL } from '../utils/api';

interface FinalScreenProps {
  renderProgress: RenderProgress | null;
  renderOutput: string | null;
  roomCode: string;
  onNewDub: () => void;
}

export default function FinalScreen({ renderProgress, renderOutput, roomCode, onNewDub }: FinalScreenProps) {
  const isRendering = renderProgress && renderProgress.status === 'processing';
  const isCompleted = renderProgress?.status === 'completed' || !!renderOutput;
  const isFailed = renderProgress?.status === 'failed';
  const progress = renderProgress?.progress ?? 0;

  const handleDownload = () => {
    if (renderOutput) {
      const link = document.createElement('a');
      link.href = `${API_URL}/${renderOutput}`;
      link.download = `dublajlab_${roomCode}_${Date.now()}.mp4`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-ambient">
      <div className="w-full max-w-3xl animate-fade-in relative z-10">
        {/* Render devam ediyor */}
        {isRendering && (
          <div className="card-glass text-center p-8 lg:p-12">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-3xl">🎬</div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Video Hazırlanıyor</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
              Lütfen bekleyin, ses kayıtları profesyonel bir şekilde video ile birleştiriliyor...
            </p>

            {/* İlerleme çubuğu */}
            <div className="w-full max-w-md mx-auto mb-6">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-gray-400 font-medium tracking-wide uppercase">İlerleme</span>
                <span className="text-accent font-mono font-bold text-sm">%{progress}</span>
              </div>
              <div className="w-full h-3 bg-black/40 border border-white/5 rounded-full overflow-hidden relative">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out bg-accent shadow-[0_0_15px_rgba(45,212,168,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              Sayfa yenilense de render devam edecektir
            </p>
          </div>
        )}

        {/* Render tamamlandı */}
        {isCompleted && renderOutput && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 text-4xl mb-6 shadow-[0_0_30px_rgba(45,212,168,0.15)] relative">
                <div className="absolute -top-2 -right-2 text-2xl animate-bounce">✨</div>
                🎉
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Dublaj Tamamlandı!</h2>
              <p className="text-gray-400 text-sm">
                İşte ortaya çıkan başyapıtınız
              </p>
            </div>

            {/* Video oynatıcı */}
            <div className="card-glass p-2">
              <div className="relative overflow-hidden rounded-xl bg-black border border-white/5 shadow-2xl">
                <video
                  src={`${API_URL}/${renderOutput}`}
                  controls
                  autoPlay
                  className="w-full block"
                  style={{ maxHeight: '65vh' }}
                >
                  Tarayıcınız video oynatmayı desteklemiyor.
                </video>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const video = document.querySelector('video');
                  if (video) {
                    video.currentTime = 0;
                    video.play();
                  }
                }}
                className="btn-secondary w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-4 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tekrar Oynat
              </button>

              <button
                onClick={handleDownload}
                className="btn-primary w-full sm:w-auto flex-[1.5] flex items-center justify-center gap-2 py-4 shadow-[0_0_20px_rgba(45,212,168,0.25)] text-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Videoyu Kaydet
              </button>

              <button
                onClick={onNewDub}
                className="btn-secondary w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-4 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Dublaj
              </button>
            </div>
          </div>
        )}

        {/* Render başarısız */}
        {isFailed && (
          <div className="card-glass text-center p-10 border-danger/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center text-4xl mb-6">
              ❌
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Video Oluşturulamadı</h2>
            <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
              Video oluşturulurken teknik bir hata oluştu. Lütfen tekrar deneyin.
            </p>
            <button onClick={onNewDub} className="btn-primary w-full max-w-xs mx-auto">
              Ana Sayfaya Dön
            </button>
          </div>
        )}

        {/* Henüz render başlamamış */}
        {!isRendering && !isCompleted && !isFailed && (
          <div className="card-glass text-center p-12">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 opacity-80">
              ⏳
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Render Bekleniyor</h2>
            <p className="text-gray-400 text-sm max-w-sm mx-auto">
              Oda sahibi (host) render işlemini başlattığında sonuçları burada görebileceksiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

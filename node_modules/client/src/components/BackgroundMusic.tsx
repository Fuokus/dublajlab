import { useState, useRef, useEffect } from 'react';

export default function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio object once
  useEffect(() => {
    // Kendi sunucumuzdaki public/Lovesong.mp3'ü yükler
    const audio = new Audio('/Lovesong.mp3');
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    // Autoplay attempt (might fail due to browser policies until user interacts)
    const tryPlay = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.log("Tarayıcı otomatik oynatmayı engelledi, kullanıcının tıklaması bekleniyor.");
      }
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []); // Only run once on mount

  // Update volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div 
      className="fixed top-6 right-6 z-50 flex items-center gap-3 transition-all duration-500 ease-out"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gizli Panel (Hover ile açılır) - Şarkı Adı ve Ses Kontrolü */}
      <div 
        className={`flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 px-5 py-2.5 rounded-full shadow-2xl transition-all duration-500 ease-out origin-right overflow-hidden ${
          isHovered ? 'opacity-100 translate-x-0 max-w-[300px]' : 'opacity-0 translate-x-4 max-w-0 !px-0 !border-transparent'
        }`}
      >
        <div className="flex flex-col min-w-[120px]">
          <span className="text-[10px] text-accent uppercase tracking-wider font-bold">Çalan Parça</span>
          <span className="text-xs text-white font-medium truncate">Adele - Lovesong</span>
        </div>

        <div className="w-px h-6 bg-white/10 mx-1"></div>

        <div className="flex items-center gap-2 w-24">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume} 
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full accent-accent h-1 bg-white/20 rounded-lg appearance-none cursor-pointer transition-all hover:h-1.5"
          />
        </div>
      </div>

      {/* Ana Buton */}
      <button
        onClick={togglePlay}
        className="relative group w-14 h-14 flex items-center justify-center rounded-full outline-none"
        title={isPlaying ? "Müziği Durdur" : "Müziği Oynat"}
      >
        {/* Arka Plan Glass Efekti */}
        <div className={`absolute inset-0 rounded-full backdrop-blur-xl border transition-all duration-500 ${
          isPlaying 
            ? 'bg-accent/10 border-accent/30 shadow-[0_0_20px_rgba(45,212,168,0.2)]' 
            : 'bg-white/5 border-white/10 group-hover:bg-white/10'
        }`}></div>

        {/* Dönen Çember Efekti (Çalarken) */}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent/60 border-l-accent/40 animate-[spin_3s_linear_infinite]"></div>
        )}

        {/* İkon */}
        <div className={`relative z-10 transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-100'}`}>
          {isPlaying ? (
            <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 4.5v15a.5.5 0 00.77.416l12-7.5a.5.5 0 000-.832l-12-7.5A.5.5 0 007 4.5z" />
            </svg>
          )}
        </div>
      </button>
    </div>
  );
}

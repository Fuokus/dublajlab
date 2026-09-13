import { useState, useEffect, useRef } from 'react';
import { getToken, getUser, removeToken } from '../utils/auth';
import type { DiscordUser } from '../utils/auth';
import { QUOTES } from '../config/quotes';

interface HomePageProps {
  onCreateRoom: (token: string) => void;
  onJoinRoom: (roomCode: string, token: string) => void;
  error: string | null;
  connected: boolean;
  user: DiscordUser | null;
  onOpenAdmin?: () => void;
}

export default function HomePage({ onCreateRoom, onJoinRoom, error, connected, user, onOpenAdmin }: HomePageProps) {
  const [roomCode, setRoomCode] = useState('');
  const [mode, setMode] = useState<'home' | 'join'>('home');
  const [localError, setLocalError] = useState<string | null>(null);
  
  const [floatingQuotes, setFloatingQuotes] = useState<any[]>([]);
  const quoteIdCounter = useRef(0);
  const zoneIndex = useRef(0);

  // Ekranı 6 farklı bölgeye (zone) ayırdık ki replikler hep aynı yere yığılmasın
  const ZONES = [
    { x: [2, 25], y: [10, 40] }, // Sol Üst
    { x: [70, 95], y: [50, 85] }, // Sağ Alt
    { x: [2, 25], y: [50, 85] }, // Sol Alt
    { x: [70, 95], y: [10, 40] }, // Sağ Üst
    { x: [30, 70], y: [5, 20] },  // Orta Üst
    { x: [30, 70], y: [80, 95] }  // Orta Alt
  ];

  useEffect(() => {
    const spawnQuote = () => {
      const quoteText = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      const id = quoteIdCounter.current++;
      
      // Sıradaki bölgeyi al ve indeksi ilerlet (Round-robin)
      const currentZone = ZONES[zoneIndex.current];
      zoneIndex.current = (zoneIndex.current + 1) % ZONES.length;
      
      // Bölge sınırları içinde rastgele bir X ve Y seç
      const randomX = currentZone.x[0] + Math.random() * (currentZone.x[1] - currentZone.x[0]);
      const randomY = currentZone.y[0] + Math.random() * (currentZone.y[1] - currentZone.y[0]);
      
      const newQuote = {
        id,
        text: quoteText,
        left: `${randomX}%`,
        top: `${randomY}%`,
        duration: `${15 + Math.random() * 10}s`, // 15-25 sn uçuş
        tx: `${(Math.random() - 0.5) * 150}px`, // Sağa/sola daha hafif savrulma
        ty: `${-80 - Math.random() * 120}px`, // Yukarı doğru yavaşça süzülme
        rotStart: `${(Math.random() - 0.5) * 15}deg`,
        rotEnd: `${(Math.random() - 0.5) * 30}deg`,
        fontSize: `${1 + Math.random() * 1.5}rem` // 1rem - 2.5rem
      };

      setFloatingQuotes(prev => [...prev, newQuote]);

      setTimeout(() => {
        setFloatingQuotes(prev => prev.filter(q => q.id !== id));
      }, parseFloat(newQuote.duration) * 1000);
    };

    // Başlangıçta tüm bölgelere birer tane dağıt
    for (let i = 0; i < ZONES.length; i++) {
      setTimeout(spawnQuote, i * 400);
    }

    // Her seferinde rastgele bir bekleme süresiyle kendini çağıran döngü
    let timeoutId: NodeJS.Timeout;
    const scheduleNextSpawn = () => {
      spawnQuote();
      // 1.5 ile 2.5 saniye arasında rastgele bir sürede yeni replik yolla
      timeoutId = setTimeout(scheduleNextSpawn, 1500 + Math.random() * 1000);
    };

    // Döngüyü başlat
    scheduleNextSpawn();

    return () => clearTimeout(timeoutId);
  }, []);

  const handleCreateRoom = () => {
    const token = getToken();
    if (!token || !user) {
      setLocalError('Lütfen önce Discord ile giriş yapın');
      return;
    }
    setLocalError(null);
    onCreateRoom(token);
  };

  const handleJoinRoom = () => {
    const token = getToken();
    if (!token || !user) {
      setLocalError('Lütfen önce Discord ile giriş yapın');
      return;
    }
    if (!roomCode.trim()) {
      setLocalError('Lütfen oda kodunu girin');
      return;
    }
    if (roomCode.trim().length !== 6) {
      setLocalError('Oda kodu 6 haneli olmalıdır');
      return;
    }
    setLocalError(null);
    onJoinRoom(roomCode.trim().toUpperCase(), token);
  };

  const handleDiscordLogin = () => {
    window.location.href = '/api/auth/discord';
  };

  const handleLogout = () => {
    removeToken();
    window.location.reload();
  };

  const displayError = error || localError;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-ambient relative overflow-hidden py-12">
      
      {/* Arka plan süzülen efsanevi replikler */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {floatingQuotes.map((quote) => (
          <div 
            key={quote.id}
            className="absolute text-white/40 font-semibold whitespace-nowrap animate-fly-fade select-none"
            style={{
              top: quote.top,
              left: quote.left,
              fontSize: quote.fontSize,
              filter: 'blur(1px)',
              ['--tx' as any]: quote.tx,
              ['--ty' as any]: quote.ty,
              ['--duration' as any]: quote.duration,
              ['--rot-start' as any]: quote.rotStart,
              ['--rot-end' as any]: quote.rotEnd,
            }}
          >
            "{quote.text}"
          </div>
        ))}
      </div>

      <div className="w-full max-w-4xl animate-fade-in relative z-10 mx-auto flex flex-col items-center">
        
        {/* Üst Kısım: Logo ve Kart */}
        <div className="w-full max-w-md">
          {/* Logo ve Başlık */}
          <div className="text-center mb-10">
            <div className="inline-block animate-float">
              <img 
                src="/logo.png" 
                alt="DublajLab" 
                className="w-20 h-20 mx-auto rounded-2xl shadow-2xl mb-5 border border-white/5"
                style={{ boxShadow: '0 8px 40px rgba(45, 212, 168, 0.25)' }}
              />
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-xl">
              Dublaj<span className="text-accent">Lab</span>
            </h1>
            <p className="text-gray-400 mt-3 text-sm leading-relaxed">
              Arkadaşlarınla sahneleri kendi sesinizle<br />yeniden dublajla.
            </p>
          </div>

          {/* Bağlantı durumu */}
          {!connected && (
            <div className="mb-5 p-3 rounded-xl text-warning text-xs text-center animate-slide-up"
              style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
              <span className="inline-block w-2 h-2 rounded-full bg-warning animate-pulse mr-2"></span>
              Sunucuya bağlanılıyor...
            </div>
          )}

          {/* Hata */}
          {displayError && (
            <div className="mb-5 p-3 rounded-xl text-danger text-sm text-center animate-slide-up"
              style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
              {displayError}
            </div>
          )}

          {/* Form Kartı */}
          <div className="card-glass w-full">
            {!user ? (
              /* Giriş yapılmamış: Discord ile giriş butonu */
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center transition-transform hover:scale-110 duration-300"
                  style={{ background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.2)' }}>
                  <svg width="28" height="21" viewBox="0 0 71 55" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2799 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.8999 37.3253 47.3178 37.3253Z"/>
                  </svg>
                </div>
                <p className="text-gray-400 text-sm mb-6">Başlamak için Discord hesabınla giriş yap</p>
                <button
                  id="discord-login-btn"
                  onClick={handleDiscordLogin}
                  className="w-full py-3.5 px-6 rounded-xl font-semibold text-white text-base transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #5865F2, #4752C4)',
                    boxShadow: '0 4px 24px rgba(88, 101, 242, 0.35)',
                  }}
                >
                  <svg width="20" height="15" viewBox="0 0 71 55" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1099 30.1693C30.1099 34.1136 27.2799 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.7018 30.1693C53.7018 34.1136 50.8999 37.3253 47.3178 37.3253Z"/>
                  </svg>
                  Discord ile Giriş Yap
                </button>
                <p className="text-xs text-gray-600 mt-4">Güvenli giriş · Herhangi bir hesap bilgisi saklanmaz</p>
              </div>
            ) : (
              /* Giriş yapılmış: Kullanıcı bilgisi + oda oluştur/katıl */
              <>
                {/* Kullanıcı bilgisi */}
                <div className="flex items-center gap-4 mb-6 p-3.5 rounded-xl transition-all duration-300 hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-11 h-11 rounded-full shadow-lg"
                    style={{ boxShadow: '0 0 0 2px rgba(45, 212, 168, 0.4)' }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white tracking-wide">{user.username}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                      Çevrimiçi
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-gray-400 hover:text-danger hover:bg-danger/10 transition-all px-3 py-1.5 rounded-lg border border-transparent hover:border-danger/20"
                    title="Çıkış Yap"
                  >
                    Çıkış
                  </button>
                </div>

                {mode === 'home' ? (
                  <div className="space-y-4">
                    <button
                      id="create-room-btn"
                      onClick={handleCreateRoom}
                      disabled={!connected}
                      className="btn-primary w-full text-base py-4 shadow-lg shadow-accent/20 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Yeni Oda Oluştur
                    </button>
                    
                    <button
                      id="join-room-btn"
                      onClick={() => setMode('join')}
                      className="btn-secondary w-full text-base py-4 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                      </svg>
                      Odaya Katıl
                    </button>
                    
                    {user?.id === '931540241691582466' && onOpenAdmin && (
                      <button
                        onClick={onOpenAdmin}
                        className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 mt-4 flex items-center justify-center gap-2 group"
                        style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.2)',
                          color: '#fcd34d',
                        }}
                      >
                        <span className="group-hover:rotate-12 transition-transform duration-300">🛡️</span> 
                        Yönetici Paneli
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="room-code-input" className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                        Oda Kodu
                      </label>
                      <input
                        id="room-code-input"
                        type="text"
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        placeholder="ÖRN: X7K9A2"
                        maxLength={6}
                        autoComplete="off"
                        className="input-field text-center text-3xl font-mono tracking-[0.4em] py-5 shadow-inner bg-black/20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleJoinRoom();
                        }}
                        autoFocus
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setMode('home');
                          setRoomCode('');
                          setLocalError(null);
                        }}
                        className="btn-secondary flex-1 text-sm py-4"
                      >
                        Geri
                      </button>
                      <button
                        id="submit-join-btn"
                        onClick={handleJoinRoom}
                        disabled={!connected}
                        className="btn-primary flex-[2] text-sm py-4 flex items-center justify-center gap-2"
                      >
                        Odaya Katıl
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {mode === 'home' && (
          <div className="w-full mt-16 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-center mb-8">
              <h2 className="text-lg font-bold text-white tracking-wide uppercase flex items-center justify-center gap-3">
                <span className="w-8 h-px bg-white/20"></span>
                Nasıl Çalışır?
                <span className="w-8 h-px bg-white/20"></span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card-glass p-6 text-center transition-transform hover:-translate-y-2 duration-300 group">
                <div className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-accent/20 group-hover:scale-110 transition-transform">
                  🤝
                </div>
                <h3 className="text-white font-bold text-base mb-2">1. Odana Katıl</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Arkadaşlarınla buluş veya yeni bir oda oluşturup kodla onları davet et.
                </p>
              </div>
              
              <div className="card-glass p-6 text-center transition-transform hover:-translate-y-2 duration-300 group delay-100">
                <div className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-accent/20 group-hover:scale-110 transition-transform">
                  🎭
                </div>
                <h3 className="text-white font-bold text-base mb-2">2. Karakter Seç</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  İstediğiniz sahneyi belirleyin ve seslendireceğiniz karakterleri paylaşın.
                </p>
              </div>

              <div className="card-glass p-6 text-center transition-transform hover:-translate-y-2 duration-300 group delay-200">
                <div className="w-14 h-14 mx-auto bg-accent/10 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-accent/20 group-hover:scale-110 transition-transform">
                  🎙️
                </div>
                <h3 className="text-white font-bold text-base mb-2">3. Kayda Başla</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Video üzerinde doğru zamanda kendi repliklerini kaydet, filmi yeniden yarat!
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

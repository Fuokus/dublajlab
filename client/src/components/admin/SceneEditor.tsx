import { useState, useRef } from 'react';
import { createScene, updateScene, uploadSceneVideo } from '../../utils/api';
import type { Scene, Character, Dialogue } from '../../types';

type DraftDialogue = Omit<Dialogue, 'id' | 'characterId' | 'createdAt' | 'updatedAt'> & { id?: string };
type DraftCharacter = Omit<Character, 'id' | 'sceneId' | 'createdAt' | 'updatedAt' | 'dialogues'> & { id?: string, dialogues: DraftDialogue[] };

export default function SceneEditor({ scene, onClose }: { scene: Scene | null, onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState(scene?.name || '');
  const [description, setDescription] = useState(scene?.description || '');
  const [audioMode, setAudioMode] = useState<'original' | 'background' | 'muted'>(scene?.audioMode || 'muted');
  const [videoPath, setVideoPath] = useState(scene?.videoPath || '');
  
  const [characters, setCharacters] = useState<DraftCharacter[]>(
    scene ? scene.characters.map(c => ({
      id: c.id,
      name: c.name,
      orderIndex: c.orderIndex,
      dialogues: c.dialogues.map(d => ({
        id: d.id,
        text: d.text,
        startTime: d.startTime,
        endTime: d.endTime,
        orderIndex: d.orderIndex
      }))
    })) : []
  );

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setSaving(true);
      setError(null);
      const res = await uploadSceneVideo(file);
      setVideoPath(res.videoPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video yüklenemedi');
    } finally {
      setSaving(false);
    }
  };

  const addCharacter = () => {
    setCharacters([...characters, { name: 'Yeni Karakter', orderIndex: characters.length, dialogues: [] }]);
  };

  const removeCharacter = (charIndex: number) => {
    setCharacters(characters.filter((_, i) => i !== charIndex));
  };

  const addDialogue = (charIndex: number) => {
    const newChars = [...characters];
    newChars[charIndex].dialogues.push({
      text: 'Yeni replik',
      startTime: 0,
      endTime: 3,
      orderIndex: newChars[charIndex].dialogues.length
    });
    setCharacters(newChars);
  };

  const removeDialogue = (charIndex: number, diagIndex: number) => {
    const newChars = [...characters];
    newChars[charIndex].dialogues = newChars[charIndex].dialogues.filter((_, i) => i !== diagIndex);
    setCharacters(newChars);
  };

  const updateDialogue = (charIndex: number, diagIndex: number, field: keyof DraftDialogue, value: any) => {
    const newChars = [...characters];
    newChars[charIndex].dialogues[diagIndex] = { ...newChars[charIndex].dialogues[diagIndex], [field]: value };
    setCharacters(newChars);
  };

  const captureTime = (charIndex: number, diagIndex: number, field: 'startTime' | 'endTime') => {
    if (videoRef.current) {
      const time = Number(videoRef.current.currentTime.toFixed(2));
      updateDialogue(charIndex, diagIndex, field, time);
    }
  };

  const playSegment = (start: number, end: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play();
      
      const checkEnd = () => {
        if (videoRef.current && videoRef.current.currentTime >= end) {
          videoRef.current.pause();
          videoRef.current.removeEventListener('timeupdate', checkEnd);
        }
      };
      videoRef.current.addEventListener('timeupdate', checkEnd);
    }
  };

  const handleSave = async () => {
    if (!name || !videoPath) {
      setError('Sahne adı ve video dosyası zorunludur');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        name,
        description,
        videoPath,
        audioMode,
        characters: characters as any
      };

      if (scene) {
        await updateScene(scene.id, payload);
      } else {
        await createScene(payload);
      }
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-ambient pb-24">
      <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#080b10]/80 backdrop-blur-md z-20 py-4 -mx-4 px-4 md:mx-0 md:px-0">
          <h1 className="text-2xl font-bold text-white flex items-center gap-4">
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 text-gray-400 hover:text-white"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              ←
            </button>
            {scene ? 'Sahneyi Düzenle' : 'Yeni Sahne Oluştur'}
          </h1>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl mb-6 text-danger text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sol Kolon: Video ve Temel Bilgiler */}
          <div className="lg:col-span-5 space-y-6">
            <div className="card-glass p-6 space-y-5">
              <h2 className="font-semibold text-lg text-white mb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(45, 212, 168, 0.15)' }}>📝</span>
                Temel Bilgiler
              </h2>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Sahne Adı</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="input-field" 
                  placeholder="Örn: Kolpaçino - Kumar Masası"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Açıklama</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="input-field" 
                  rows={3}
                  placeholder="Sahnenin kısa özeti..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Video Dosyası</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="video/mp4" 
                    onChange={handleVideoUpload}
                    className="w-full text-sm text-gray-400 
                      file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 
                      file:text-sm file:font-medium file:bg-white/5 file:text-white 
                      hover:file:bg-white/10 file:transition-colors file:cursor-pointer
                      border border-white/10 rounded-xl p-1.5 bg-white/5"
                  />
                </div>
                {videoPath && <p className="text-xs text-accent mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-accent"></span> Yüklendi: {videoPath.split('/').pop()}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Ses Modu</label>
                <select 
                  value={audioMode} 
                  onChange={e => setAudioMode(e.target.value as any)}
                  className="input-field"
                >
                  <option value="muted">Sessiz (Sadece dublaj duyulur)</option>
                  <option value="background">Arka Plan (Orijinal ses çok kısık)</option>
                  <option value="original">Orijinal (Normal seviye)</option>
                </select>
              </div>
            </div>

            {videoPath && (
              <div className="card-glass p-4 sticky top-28">
                <h2 className="font-semibold text-sm text-gray-300 mb-3 px-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                    style={{ background: 'rgba(45, 212, 168, 0.15)' }}>👁️</span>
                  Video Önizleme (Zamanlama İçin)
                </h2>
                <div className="rounded-xl overflow-hidden shadow-2xl border border-white/10">
                  <video 
                    ref={videoRef} 
                    src={`/${videoPath}`} 
                    controls 
                    className="w-full bg-black block"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center px-4 leading-relaxed">
                  Videoyu izlerken repliklerin saniyelerini yandaki "Ayarla" butonlarıyla otomatik kaydedebilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Karakterler ve Diyaloglar */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(45, 212, 168, 0.15)' }}>🎭</span>
                Karakterler & Replikler
              </h2>
              <button 
                onClick={addCharacter} 
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2"
                style={{ background: 'rgba(45, 212, 168, 0.1)', color: '#2dd4a8' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(45, 212, 168, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(45, 212, 168, 0.1)'}
              >
                <span>+</span> Yeni Karakter
              </button>
            </div>

            {characters.map((char, cIdx) => (
              <div key={cIdx} className="card-glass p-5">
                <div className="flex gap-3 mb-6 items-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                    {cIdx + 1}
                  </div>
                  <input 
                    type="text" 
                    value={char.name}
                    onChange={e => {
                      const newChars = [...characters];
                      newChars[cIdx].name = e.target.value;
                      setCharacters(newChars);
                    }}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-medium focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
                    placeholder="Karakter Adı"
                  />
                  <button 
                    onClick={() => removeCharacter(cIdx)} 
                    className="text-gray-500 hover:text-danger hover:bg-danger/10 px-4 py-2.5 rounded-xl transition-all font-medium text-sm"
                  >
                    Karakteri Sil
                  </button>
                </div>

                <div className="space-y-4 pl-4 md:pl-10 relative">
                  {/* Dikey çizgi */}
                  <div className="absolute left-[1.35rem] md:left-[3.35rem] top-2 bottom-6 w-px bg-white/10"></div>
                  
                  {char.dialogues.map((diag, dIdx) => (
                    <div key={dIdx} className="relative rounded-xl border border-white/10 p-4 transition-all duration-300 hover:border-white/20"
                      style={{ background: 'rgba(0,0,0,0.2)' }}>
                      {/* Çizgi bağlantısı */}
                      <div className="absolute -left-4 md:-left-[2.1rem] top-6 w-4 md:w-8 h-px bg-white/10"></div>
                      
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <textarea 
                          value={diag.text}
                          onChange={e => updateDialogue(cIdx, dIdx, 'text', e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:border-accent focus:outline-none transition-colors"
                          rows={2}
                          placeholder="Replik metni..."
                        />
                        <button 
                          onClick={() => removeDialogue(cIdx, dIdx)} 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">Başlangıç</span>
                          <input 
                            type="number" step="0.1"
                            value={diag.startTime}
                            onChange={e => updateDialogue(cIdx, dIdx, 'startTime', parseFloat(e.target.value))}
                            className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white text-center font-mono"
                          />
                          <button 
                            onClick={() => captureTime(cIdx, dIdx, 'startTime')} 
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent hover:text-black transition-colors"
                          >
                            Ayarla
                          </button>
                        </div>
                        
                        <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">Bitiş</span>
                          <input 
                            type="number" step="0.1"
                            value={diag.endTime}
                            onChange={e => updateDialogue(cIdx, dIdx, 'endTime', parseFloat(e.target.value))}
                            className="w-16 bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white text-center font-mono"
                          />
                          <button 
                            onClick={() => captureTime(cIdx, dIdx, 'endTime')} 
                            className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent hover:text-black transition-colors"
                          >
                            Ayarla
                          </button>
                        </div>

                        <div className="flex-1 flex justify-end">
                          <button 
                            onClick={() => playSegment(diag.startTime, diag.endTime)} 
                            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-accent hover:bg-accent/10 transition-all flex items-center gap-2"
                          >
                            <span className="text-accent">▶</span> Dinle
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="relative pt-2">
                    <button 
                      onClick={() => addDialogue(cIdx)} 
                      className="text-sm font-medium text-gray-400 hover:text-accent flex items-center gap-2 transition-colors pl-2"
                    >
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center">+</span>
                      Replik Ekle
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {characters.length === 0 && (
              <div className="card-glass py-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  🎭
                </div>
                <h3 className="text-gray-300 font-medium mb-1">Henüz karakter eklenmedi</h3>
                <p className="text-gray-500 text-sm mb-4">Senaryodaki karakterleri ve repliklerini buradan ekleyebilirsiniz.</p>
                <button 
                  onClick={addCharacter}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2"
                  style={{ background: 'rgba(45, 212, 168, 0.1)', color: '#2dd4a8' }}
                >
                  <span>+</span> İlk Karakteri Ekle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

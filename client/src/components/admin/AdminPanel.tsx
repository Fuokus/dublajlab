import { useState, useEffect } from 'react';
import { fetchAdminScenes, deleteScene } from '../../utils/api';
import type { Scene } from '../../types';
import SceneEditor from './SceneEditor';

export default function AdminPanel({ onBack }: { onBack: () => void }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingScene, setEditingScene] = useState<Scene | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadScenes = async () => {
    try {
      setLoading(true);
      const data = await fetchAdminScenes();
      setScenes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenes();
  }, []);

  const handleDelete = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    
    try {
      await deleteScene(id);
      setDeletingId(null);
      loadScenes();
    } catch (err) {
      alert('Silinemedi: ' + (err instanceof Error ? err.message : ''));
      setDeletingId(null);
    }
  };

  if (editingScene) {
    return (
      <SceneEditor 
        scene={editingScene === 'new' ? null : editingScene} 
        onClose={() => {
          setEditingScene(null);
          loadScenes();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-ambient">
      <div className="max-w-6xl mx-auto animate-fade-in relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="DublajLab" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Yönetici <span className="text-accent">Paneli</span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Sahneleri ve diyalogları buradan yönetebilirsiniz.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary text-sm">
              ← Ana Sayfa
            </button>
            <button onClick={() => setEditingScene('new')} className="btn-primary text-sm">
              + Yeni Sahne
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl mb-6 text-danger text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 mx-auto rounded-full animate-spin mb-4"
              style={{ border: '2px solid rgba(45, 212, 168, 0.1)', borderTopColor: '#2dd4a8' }} />
            <p className="text-gray-500 text-sm">Yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scenes.map((scene) => (
              <div key={scene.id} className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                }}>
                <div className="p-5 flex flex-col h-full">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-base text-white leading-snug pr-2">{scene.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          background: scene.audioMode === 'muted' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(45, 212, 168, 0.12)',
                          color: scene.audioMode === 'muted' ? '#ef4444' : '#2dd4a8'
                        }}>
                        {scene.audioMode === 'muted' ? 'Sessiz' : scene.audioMode === 'background' ? 'Arka Plan' : 'Orijinal'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">{scene.description}</p>
                    
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>
                        {scene.characters?.length || 0} Karakter
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent/50"></span>
                        {scene.characters?.flatMap(c => c.dialogues).length || 0} Replik
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                      onClick={() => setEditingScene(scene)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-gray-300 hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(45, 212, 168, 0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    >
                      Düzenle
                    </button>
                    <button 
                      onClick={() => handleDelete(scene.id)}
                      onMouseLeave={() => deletingId === scene.id && setDeletingId(null)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                        deletingId === scene.id 
                          ? 'bg-danger text-white' 
                          : 'text-gray-500 hover:text-danger'
                      }`}
                      style={deletingId !== scene.id ? { background: 'rgba(255,255,255,0.04)' } : {}}
                      title="Sil"
                    >
                      {deletingId === scene.id ? 'Emin misiniz?' : '🗑️'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Yeni sahne ekle kartı */}
            <button 
              onClick={() => setEditingScene('new')} 
              className="rounded-2xl p-5 flex flex-col items-center justify-center min-h-[200px] transition-all duration-300 group hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '2px dashed rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(45, 212, 168, 0.3)';
                e.currentTarget.style.background = 'rgba(45, 212, 168, 0.03)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                style={{ background: 'rgba(45, 212, 168, 0.1)' }}>
                <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-400 group-hover:text-accent transition-colors">Yeni Sahne Ekle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

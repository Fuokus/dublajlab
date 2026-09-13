import type { Scene } from '../types';

interface SceneSelectorProps {
  scenes: Scene[];
  selectedSceneId: string | null;
  onSelect: (sceneId: string) => void;
  disabled?: boolean;
}

export default function SceneSelector({ scenes, selectedSceneId, onSelect, disabled }: SceneSelectorProps) {
  if (scenes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-4xl mb-3">🎬</div>
        <p className="text-sm">Henüz sahne eklenmemiş</p>
        <p className="text-xs text-gray-600 mt-1">Yönetici sahne ekledikten sonra burada görünecek</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {scenes.map((scene) => (
        <button
          key={scene.id}
          onClick={() => onSelect(scene.id)}
          disabled={disabled}
          className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
            selectedSceneId === scene.id
              ? 'bg-accent/10 border-accent/50 shadow-lg shadow-accent/10'
              : 'bg-surface-600 border-surface-400 hover:border-surface-400 hover:bg-surface-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm">{scene.name}</h3>
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{scene.description}</p>

              <div className="flex items-center gap-3 mt-3">
                <span className="badge-accent">
                  🎭 {scene.characters.length} karakter
                </span>
                <span className="badge bg-surface-400 text-gray-300">
                  💬 {scene.characters.reduce((sum, c) => sum + c.dialogues.length, 0)} replik
                </span>
              </div>
            </div>

            {selectedSceneId === scene.id && (
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

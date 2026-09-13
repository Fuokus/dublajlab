// ==================== Veritabanı Modelleri ====================

export interface Room {
  id: string;
  code: string;
  hostSocketId: string;
  sceneId: string | null;
  status: 'waiting' | 'playing' | 'recording' | 'rendering' | 'completed';
  createdAt: string;
  updatedAt: string;
  scene: Scene | null;
  players: Player[];
}

export interface Player {
  id: string;
  roomId: string;
  socketId: string;
  nickname: string;
  discordId: string | null;
  avatarUrl: string | null;
  isHost: boolean;
  isReady: boolean;
  characterId: string | null;
  character: Character | null;
  createdAt: string;
  updatedAt: string;
}

export interface Scene {
  id: string;
  name: string;
  description: string;
  videoPath: string;
  audioMode: 'original' | 'background' | 'muted';
  createdAt: string;
  updatedAt: string;
  characters: Character[];
}

export interface Character {
  id: string;
  sceneId: string;
  name: string;
  orderIndex: number;
  dialogues: Dialogue[];
}

export interface Dialogue {
  id: string;
  characterId: string;
  text: string;
  startTime: number;
  endTime: number;
  orderIndex: number;
}

export interface Recording {
  id: string;
  dialogueId: string;
  playerId: string;
  roomId: string;
  filePath: string;
  duration: number;
}

export interface Render {
  id: string;
  roomId: string;
  sceneId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath: string | null;
  errorMessage: string | null;
}

// ==================== Uygulama Durumları ====================

export type AppView = 'home' | 'lobby' | 'game' | 'final';

export interface RenderProgress {
  roomId: string;
  renderId: string;
  progress: number;
  status: string;
}

// ==================== Kayıt Durumu ====================

export type RecordingStatus = 'idle' | 'recording' | 'recorded' | 'uploading' | 'uploaded';

export interface DialogueRecordingState {
  dialogueId: string;
  status: RecordingStatus;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
}

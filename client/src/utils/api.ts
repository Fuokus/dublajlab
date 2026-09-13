import type { Scene, Recording } from '../types';
import { getToken } from './auth';

// Vercel gibi ortamlarda statik sunucu olduğu için backend adresini env dosyasından alıyoruz
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/**
 * Tüm sahneleri getir
 */
export async function fetchScenes(): Promise<Scene[]> {
  const response = await fetch(`${API_BASE}/scenes`);
  if (!response.ok) {
    throw new Error('Sahneler yüklenirken bir hata oluştu');
  }
  return response.json();
}

/**
 * Ses kaydını yükle
 */
export async function uploadRecording(
  audioBlob: Blob,
  dialogueId: string,
  playerId: string,
  roomId: string,
  duration: number
): Promise<Recording> {
  const formData = new FormData();
  formData.append('audio', audioBlob, `recording_${Date.now()}.webm`);
  formData.append('dialogueId', dialogueId);
  formData.append('playerId', playerId);
  formData.append('roomId', roomId);
  formData.append('duration', duration.toString());

  const response = await fetch(`${API_BASE}/upload/recording`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Kayıt yüklenemedi');
  }

  return response.json();
}

/**
 * Render başlat
 */
export async function startRender(roomId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/render/${roomId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Video oluşturulurken bir hata oluştu');
  }
}

/**
 * Render durumunu sorgula
 */
export async function getRenderStatus(roomId: string) {
  const response = await fetch(`${API_BASE}/render/${roomId}/status`);
  if (!response.ok) return null;
  return response.json();
}

// ==================== ADMIN API ====================

function getAuthHeaders() {
  const token = getToken();
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export async function fetchAdminScenes(): Promise<Scene[]> {
  const response = await fetch(`${API_BASE}/admin/scenes`, {
    headers: getAuthHeaders()
  });
  if (!response.ok) throw new Error('Admin sahneleri getirilemedi');
  return response.json();
}

export async function uploadSceneVideo(videoBlob: Blob): Promise<{ videoPath: string }> {
  const formData = new FormData();
  formData.append('video', videoBlob, `scene_${Date.now()}.mp4`);

  const response = await fetch(`${API_BASE}/admin/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (!response.ok) throw new Error('Video yüklenemedi');
  return response.json();
}

export async function createScene(sceneData: Partial<Scene>): Promise<Scene> {
  const response = await fetch(`${API_BASE}/admin/scenes`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sceneData),
  });
  
  if (!response.ok) throw new Error('Sahne oluşturulamadı');
  return response.json();
}

export async function updateScene(id: string, sceneData: Partial<Scene>): Promise<Scene> {
  const response = await fetch(`${API_BASE}/admin/scenes/${id}`, {
    method: 'PUT',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sceneData),
  });
  
  if (!response.ok) throw new Error('Sahne güncellenemedi');
  return response.json();
}

export async function deleteScene(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/scenes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) throw new Error('Sahne silinemedi');
}

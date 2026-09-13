import { randomInt } from 'crypto';
import path from 'path';

/**
 * 6 haneli benzersiz oda kodu üretir (büyük harf + rakam)
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışıklık yaratabilecek 0/O, 1/I/L çıkarıldı
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[randomInt(chars.length)];
  }
  return code;
}

/**
 * Saniye değerini mm:ss.ms formatına dönüştürür
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 10);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
}

/**
 * Dosya yolunun güvenli olup olmadığını kontrol eder (path traversal koruması)
 */
export function isSafePath(filePath: string, baseDir: string): boolean {
  const resolvedPath = path.resolve(baseDir, filePath);
  const resolvedBase = path.resolve(baseDir);
  return resolvedPath.startsWith(resolvedBase);
}

/**
 * Dosya uzantısının izin verilenler arasında olup olmadığını kontrol eder
 */
export function isAllowedAudioExtension(filename: string): boolean {
  const allowed = ['.webm', '.ogg', '.wav', '.mp3', '.m4a', '.opus'];
  const ext = path.extname(filename).toLowerCase();
  return allowed.includes(ext);
}

/**
 * Dosya uzantısının izin verilen video uzantıları arasında olup olmadığını kontrol eder
 */
export function isAllowedVideoExtension(filename: string): boolean {
  const allowed = ['.mp4', '.webm', '.mkv', '.avi', '.mov'];
  const ext = path.extname(filename).toLowerCase();
  return allowed.includes(ext);
}

/**
 * Byte cinsinden dosya boyutunu okunabilir formata dönüştürür
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Maksimum dosya boyutu: 50MB
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Maksimum ses kaydı boyutu: 10MB
 */
export const MAX_AUDIO_SIZE = 10 * 1024 * 1024;

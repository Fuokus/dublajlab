import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { isSafePath } from '../utils/helpers.js';

// npm workspaces server/ altından çalıştırır, proje root'unu bul
const BASE_DIR = path.resolve(process.cwd(), '..');

/**
 * Gerekli dizinlerin var olduğundan emin olur
 */
export function ensureDirectories() {
  const dirs = [
    path.join(BASE_DIR, process.env.UPLOAD_DIR || 'uploads'),
    path.join(BASE_DIR, process.env.RENDER_DIR || 'renders'),
    path.join(BASE_DIR, process.env.SCENE_DIR || 'scenes'),
    path.join(BASE_DIR, 'data'),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Dizin oluşturuldu: ${dir}`);
    }
  }
}

/**
 * Yüklenen dosyayı güvenli bir isimle kaydeder
 */
export function getSafeUploadPath(originalName: string, subDir?: string): { filePath: string; fullPath: string } {
  const uploadDir = path.join(BASE_DIR, process.env.UPLOAD_DIR || 'uploads');
  const ext = path.extname(originalName).toLowerCase() || '.webm';
  const fileName = `${uuidv4()}${ext}`;

  let targetDir = uploadDir;
  if (subDir) {
    targetDir = path.join(uploadDir, subDir);
    if (!isSafePath(subDir, uploadDir)) {
      throw new Error('Geçersiz dizin yolu');
    }
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
  }

  const fullPath = path.join(targetDir, fileName);
  const filePath = path.relative(BASE_DIR, fullPath).replace(/\\/g, '/');

  return { filePath, fullPath };
}

/**
 * Render çıktı yolunu oluşturur
 */
export function getRenderOutputPath(roomId: string): { filePath: string; fullPath: string } {
  const renderDir = path.join(BASE_DIR, process.env.RENDER_DIR || 'renders');
  const fileName = `${roomId}_${uuidv4()}.mp4`;
  const fullPath = path.join(renderDir, fileName);
  const filePath = path.relative(BASE_DIR, fullPath).replace(/\\/g, '/');

  return { filePath, fullPath };
}

/**
 * Dosyayı siler
 */
export function deleteFile(filePath: string): boolean {
  try {
    const fullPath = path.join(BASE_DIR, filePath);
    if (!isSafePath(filePath, BASE_DIR)) {
      console.error(`Güvensiz dosya yolu: ${filePath}`);
      return false;
    }
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Dosya silme hatası: ${filePath}`, error);
    return false;
  }
}

/**
 * Dosyanın var olup olmadığını kontrol eder
 */
export function fileExists(filePath: string): boolean {
  const fullPath = path.join(BASE_DIR, filePath);
  return fs.existsSync(fullPath);
}

/**
 * Tam dosya yolunu döndürür
 */
export function getFullPath(relativePath: string): string {
  return path.join(BASE_DIR, relativePath);
}

/**
 * Sahne video dizinini döndürür
 */
export function getSceneDir(): string {
  return path.join(BASE_DIR, process.env.SCENE_DIR || 'scenes');
}

/**
 * Geçici dosyaları temizler
 */
export function cleanTempFiles(pattern?: string) {
  const uploadDir = path.join(BASE_DIR, process.env.UPLOAD_DIR || 'uploads');
  try {
    const files = fs.readdirSync(uploadDir);
    let cleaned = 0;
    for (const file of files) {
      if (pattern && !file.includes(pattern)) continue;
      const filePath = path.join(uploadDir, file);
      const stat = fs.statSync(filePath);
      // 24 saatten eski dosyaları temizle
      if (Date.now() - stat.mtimeMs > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`${cleaned} geçici dosya temizlendi`);
    }
  } catch (error) {
    console.error('Geçici dosya temizleme hatası:', error);
  }
}

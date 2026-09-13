import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import { getRenderOutputPath, getFullPath } from './fileService.js';

const ffmpegPath = ffmpegInstaller.path;
const ffprobePath = ffprobeInstaller.path;

const prisma = new PrismaClient();

interface RenderProgress {
  roomId: string;
  renderId: string;
  progress: number;
  status: string;
}

type ProgressCallback = (progress: RenderProgress) => void;

/**
 * FFmpeg'in yüklü olup olmadığını kontrol eder
 */
export async function checkFFmpeg(): Promise<boolean> {
  return new Promise((resolve) => {
    // Statik ffmpeg binary yolunu kullanıyoruz
    const proc = spawn(ffmpegPath, ['-version']);
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
}

/**
 * Video dosyasının süresini FFprobe ile alır
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    // Statik ffprobe binary yolunu kullanıyoruz
    const proc = spawn(
      ffprobePath,
      [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        videoPath,
      ]
    );

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('error', () => reject(new Error('ffprobe bulunamadı')));
    proc.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(isNaN(duration) ? 30 : duration);
      } else {
        resolve(30); // varsayılan süre
      }
    });
  });
}

/**
 * Final videoyu oluşturur
 * Orijinal video + oyuncu ses kayıtları doğru timestamp'lere yerleştirilir
 */
export async function renderFinalVideo(
  roomId: string,
  onProgress?: ProgressCallback
): Promise<string> {
  // Render kaydı oluştur
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      scene: {
        include: {
          characters: {
            include: { dialogues: { orderBy: { orderIndex: 'asc' } } },
          },
        },
      },
      recordings: {
        include: { dialogue: true },
      },
    },
  });

  if (!room || !room.scene) {
    throw new Error('Oda veya sahne bulunamadı');
  }

  const render = await prisma.render.create({
    data: {
      roomId,
      sceneId: room.scene.id,
      status: 'processing',
      progress: 0,
    },
  });

  const notifyProgress = (progress: number, status: string) => {
    onProgress?.({ roomId, renderId: render.id, progress, status });
  };

  try {
    notifyProgress(5, 'processing');

    const videoPath = getFullPath(room.scene.videoPath);

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video dosyası bulunamadı: ${room.scene.videoPath}`);
    }

    const { filePath: outputRelPath, fullPath: outputPath } = getRenderOutputPath(roomId);
    const recordings = room.recordings;

    if (recordings.length === 0) {
      throw new Error('Hiç kayıt bulunamadı');
    }

    notifyProgress(10, 'processing');

    // Video süresini al
    let videoDuration: number;
    try {
      videoDuration = await getVideoDuration(videoPath);
    } catch {
      videoDuration = 30;
    }

    notifyProgress(15, 'processing');

    // FFmpeg komutunu oluştur
    const ffmpegArgs: string[] = [];

    // Giriş: orijinal video
    ffmpegArgs.push('-i', videoPath);

    // Giriş: her ses kaydı
    for (const rec of recordings) {
      const recFullPath = getFullPath(rec.filePath);
      if (!fs.existsSync(recFullPath)) {
        console.warn(`Kayıt dosyası bulunamadı: ${rec.filePath}`);
        continue;
      }
      ffmpegArgs.push('-i', recFullPath);
    }

    // Filter complex oluştur
    const validRecordings = recordings.filter((rec) =>
      fs.existsSync(getFullPath(rec.filePath))
    );

    if (validRecordings.length === 0) {
      throw new Error('Geçerli kayıt dosyası bulunamadı');
    }

    // Audio mode: orijinal sesi dahil et veya sessizleştir
    const audioMode = room.scene.audioMode || 'muted';

    let filterComplex = '';
    const audioStreams: string[] = [];

    // Her ses kaydını doğru timestamp'e yerleştir
    for (let i = 0; i < validRecordings.length; i++) {
      const rec = validRecordings[i];
      const startMs = Math.round(rec.dialogue.startTime * 1000);
      const endMs = Math.round(rec.dialogue.endTime * 1000);
      const maxDurationMs = endMs - startMs;

      // adelay ile timestamp'e yerleştir, atrim ile uzun kayıtları kes
      filterComplex += `[${i + 1}:a]atrim=start=0:end=${maxDurationMs / 1000},asetpts=PTS-STARTPTS,adelay=${startMs}|${startMs}[a${i}]; `;
      audioStreams.push(`[a${i}]`);
    }

    // Tüm ses streamlerini birleştir
    // Orijinal sesi her zaman ekleyelim ki video süresiyle aynı uzunlukta bir ses katmanı olsun (apad gibi davranır)
    let origVolume = '0.0'; // muted
    if (audioMode === 'original') origVolume = '1.0';
    else if (audioMode === 'background') origVolume = '0.15';
    
    filterComplex += `[0:a]volume=${origVolume}[origaudio]; `;
    audioStreams.unshift('[origaudio]');

    filterComplex += `${audioStreams.join('')}amix=inputs=${audioStreams.length}:duration=longest:dropout_transition=0[outa]`;

    ffmpegArgs.push(
      '-filter_complex', filterComplex,
      '-map', '0:v',
      '-map', '[outa]',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-y',
      outputPath
    );

    notifyProgress(20, 'processing');

    // FFmpeg'i çalıştır
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(ffmpegPath, ffmpegArgs);

      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        // FFmpeg ilerleme bilgisini parse et
        const timeMatch = data.toString().match(/time=(\d+):(\d+):(\d+)\.(\d+)/);
        if (timeMatch && videoDuration > 0) {
          const hours = parseInt(timeMatch[1]);
          const mins = parseInt(timeMatch[2]);
          const secs = parseInt(timeMatch[3]);
          const currentTime = hours * 3600 + mins * 60 + secs;
          const progress = Math.min(95, Math.round(20 + (currentTime / videoDuration) * 75));
          notifyProgress(progress, 'processing');
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`FFmpeg başlatılamadı: ${err.message}`));
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg hata kodu: ${code}\n${stderr.slice(-500)}`));
        }
      });
    });

    // Render kaydını güncelle
    await prisma.render.update({
      where: { id: render.id },
      data: {
        status: 'completed',
        progress: 100,
        outputPath: outputRelPath,
      },
    });

    // Oda durumunu güncelle
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'completed' },
    });

    notifyProgress(100, 'completed');

    return outputRelPath;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
    console.error('Render hatası:', errMsg);

    await prisma.render.update({
      where: { id: render.id },
      data: {
        status: 'failed',
        errorMessage: errMsg,
      },
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'recording' },
    });

    notifyProgress(0, 'failed');
    throw error;
  }
}

/**
 * Render durumunu sorgular
 */
export async function getRenderStatus(roomId: string) {
  return prisma.render.findFirst({
    where: { roomId },
    orderBy: { createdAt: 'desc' },
  });
}

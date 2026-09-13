import { Router, Request, Response } from 'express';
import { renderFinalVideo, getRenderStatus, checkFFmpeg } from '../services/renderService.js';

const router = Router();

// Aktif render işlemlerini takip et (birden fazla render'ı önlemek için)
const activeRenders = new Set<string>();

/**
 * POST /api/render/:roomId - Final video render başlat
 */
router.post('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    // FFmpeg kontrolü
    const ffmpegAvailable = await checkFFmpeg();
    if (!ffmpegAvailable) {
      res.status(503).json({
        error: 'FFmpeg bulunamadı. Video oluşturmak için FFmpeg kurulmalıdır.',
      });
      return;
    }

    // Zaten render ediliyorsa engelle
    if (activeRenders.has(roomId)) {
      res.status(409).json({ error: 'Bu oda için zaten bir render işlemi devam ediyor' });
      return;
    }

    activeRenders.add(roomId);

    // Socket.IO instance'ı express app'ten al
    const io = req.app.get('io');

    // Arka planda render başlat
    renderFinalVideo(roomId, (progress) => {
      // İlerlemeyi socket ile bildir
      io?.to(roomId).emit('render:progress', progress);
    })
      .then((outputPath) => {
        io?.to(roomId).emit('render:complete', { outputPath });
        activeRenders.delete(roomId);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Render hatası';
        io?.to(roomId).emit('render:error', { error: message });
        activeRenders.delete(roomId);
      });

    res.json({ message: 'Render işlemi başlatıldı' });
  } catch (error) {
    const { roomId } = req.params;
    activeRenders.delete(roomId);
    console.error('Render başlatma hatası:', error);
    res.status(500).json({ error: 'Video oluşturulurken bir hata oluştu' });
  }
});

/**
 * GET /api/render/:roomId/status - Render durumunu sorgula
 */
router.get('/:roomId/status', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const render = await getRenderStatus(roomId);

    if (!render) {
      res.status(404).json({ error: 'Render bulunamadı' });
      return;
    }

    res.json(render);
  } catch (error) {
    console.error('Render durum hatası:', error);
    res.status(500).json({ error: 'Render durumu alınamadı' });
  }
});

/**
 * GET /api/render/:roomId/check-ffmpeg - FFmpeg kontrolü
 */
router.get('/check-ffmpeg', async (_req: Request, res: Response) => {
  const available = await checkFFmpeg();
  res.json({ available });
});

export default router;

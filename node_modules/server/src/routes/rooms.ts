import { Router, Request, Response } from 'express';
import { createRoom, getRoomByCode } from '../services/roomService.js';

const router = Router();

/**
 * POST /api/rooms - Yeni oda oluştur
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { hostSocketId } = req.body;

    if (!hostSocketId) {
      res.status(400).json({ error: 'Socket ID gerekli' });
      return;
    }

    const room = await createRoom(hostSocketId);
    res.status(201).json(room);
  } catch (error) {
    console.error('Oda oluşturma hatası:', error);
    res.status(500).json({ error: 'Oda oluşturulurken bir hata oluştu' });
  }
});

/**
 * GET /api/rooms/:code - Oda bilgisini getir
 */
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const room = await getRoomByCode(code);

    if (!room) {
      res.status(404).json({ error: 'Bu oda artık mevcut değil' });
      return;
    }

    res.json(room);
  } catch (error) {
    console.error('Oda getirme hatası:', error);
    res.status(500).json({ error: 'Oda bilgisi alınırken bir hata oluştu' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/scenes - Tüm sahneleri getir
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scenes = await prisma.scene.findMany({
      include: {
        characters: {
          include: {
            dialogues: { orderBy: { orderIndex: 'asc' } },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(scenes);
  } catch (error) {
    console.error('Sahne listesi hatası:', error);
    res.status(500).json({ error: 'Sahneler yüklenirken bir hata oluştu' });
  }
});

/**
 * GET /api/scenes/:id - Belirli sahneyi getir
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scene = await prisma.scene.findUnique({
      where: { id },
      include: {
        characters: {
          include: {
            dialogues: { orderBy: { orderIndex: 'asc' } },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!scene) {
      res.status(404).json({ error: 'Sahne bulunamadı' });
      return;
    }

    res.json(scene);
  } catch (error) {
    console.error('Sahne getirme hatası:', error);
    res.status(500).json({ error: 'Sahne bilgisi alınırken bir hata oluştu' });
  }
});

export default router;

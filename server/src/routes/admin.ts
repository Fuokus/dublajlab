import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middlewares/adminAuth.js';

const router = Router();
const prisma = new PrismaClient();

// Multer yapılandırması (Sahneler için)
const BASE_DIR = path.resolve(process.cwd(), '..');
const scenesDir = path.join(BASE_DIR, process.env.SCENE_DIR || 'scenes');

if (!fs.existsSync(scenesDir)) {
  fs.mkdirSync(scenesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, scenesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

// Tüm admin rotalarını koru
router.use(requireAdmin);

// 1. Sahneleri Getir (Karakterler ve Diyaloglarla birlikte)
router.get('/scenes', async (req, res) => {
  try {
    const scenes = await prisma.scene.findMany({
      include: {
        characters: {
          include: { dialogues: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(scenes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sahneler getirilirken hata oluştu' });
  }
});

// 2. Yeni Sahne Videosu Yükle
router.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Video dosyası bulunamadı' });
  }
  
  // Veritabanında scenes/xxxx.mp4 şeklinde tutulması için
  const relativePath = `${process.env.SCENE_DIR || 'scenes'}/${req.file.filename}`;
  res.json({ videoPath: relativePath });
});

// 3. Yeni Sahne Oluştur (Veya Mevcut Sahneyi Güncelle)
router.post('/scenes', async (req, res) => {
  try {
    const { name, description, videoPath, audioMode, characters } = req.body;

    const newScene = await prisma.scene.create({
      data: {
        name,
        description,
        videoPath,
        audioMode: audioMode || 'muted',
        characters: {
          create: characters.map((char: any, i: number) => ({
            name: char.name,
            orderIndex: i,
            dialogues: {
              create: char.dialogues.map((d: any, j: number) => ({
                text: d.text,
                startTime: parseFloat(d.startTime),
                endTime: parseFloat(d.endTime),
                orderIndex: j,
              })),
            },
          })),
        },
      },
    });

    res.json(newScene);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sahne oluşturulurken hata oluştu' });
  }
});

// 4. Mevcut Sahneyi Tüm Verileriyle Güncelle
router.put('/scenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, videoPath, audioMode, characters } = req.body;

    // Önce mevcut karakterleri ve diyalogları sil (cascade silme işlemi yapar)
    await prisma.character.deleteMany({ where: { sceneId: id } });

    // Sahneyi güncelle ve yeni karakterleri ekle
    const updatedScene = await prisma.scene.update({
      where: { id },
      data: {
        name,
        description,
        videoPath,
        audioMode: audioMode || 'muted',
        characters: {
          create: characters.map((char: any, i: number) => ({
            name: char.name,
            orderIndex: i,
            dialogues: {
              create: char.dialogues.map((d: any, j: number) => ({
                text: d.text,
                startTime: parseFloat(d.startTime),
                endTime: parseFloat(d.endTime),
                orderIndex: j,
              })),
            },
          })),
        },
      },
    });

    res.json(updatedScene);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Sahne güncellenirken hata oluştu' });
  }
});

// 5. Sahne Sil
router.delete('/scenes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[DELETE] Sahne silme isteği geldi: ${id}`);
    
    // Yabancı anahtar hatalarını önlemek için bağlı odaları ve renderları temizle
    await prisma.room.updateMany({
      where: { sceneId: id },
      data: { sceneId: null }
    });
    
    await prisma.render.deleteMany({
      where: { sceneId: id }
    });

    // Sahneye ait karakterleri bul
    const characters = await prisma.character.findMany({
      where: { sceneId: id },
      select: { id: true }
    });
    const characterIds = characters.map(c => c.id);

    if (characterIds.length > 0) {
      // Oyuncuların karakter seçimlerini temizle
      await prisma.player.updateMany({
        where: { characterId: { in: characterIds } },
        data: { characterId: null }
      });

      // Diyalogları bul
      const dialogues = await prisma.dialogue.findMany({
        where: { characterId: { in: characterIds } },
        select: { id: true }
      });
      const dialogueIds = dialogues.map(d => d.id);

      // Kayıtları sil
      if (dialogueIds.length > 0) {
        await prisma.recording.deleteMany({
          where: { dialogueId: { in: dialogueIds } }
        });
        
        // Diyalogları sil
        await prisma.dialogue.deleteMany({
          where: { characterId: { in: characterIds } }
        });
      }

      // Karakterleri sil
      await prisma.character.deleteMany({
        where: { sceneId: id }
      });
    }

    // Son olarak sahneyi sil
    await prisma.scene.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('SILME HATASI:', error?.message || error);
    res.status(500).json({ error: 'Sahne silinirken hata oluştu' });
  }
});

export default router;

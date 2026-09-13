import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { addRecording } from '../services/roomService.js';
import { MAX_AUDIO_SIZE } from '../utils/helpers.js';

const BASE_DIR = path.resolve(process.cwd(), '..');
const uploadDir = path.join(BASE_DIR, process.env.UPLOAD_DIR || 'uploads');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.webm';
    const safeName = `${uuidv4()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg',
      'audio/mp4', 'audio/opus', 'video/webm', 'audio/x-wav',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
    }
  },
});

const router = Router();

/**
 * POST /api/upload/recording - Ses kaydı yükle
 */
router.post('/recording', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Ses dosyası gerekli' });
      return;
    }

    const { dialogueId, playerId, roomId, duration } = req.body;

    if (!dialogueId || !playerId || !roomId) {
      res.status(400).json({ error: 'dialogueId, playerId ve roomId gerekli' });
      return;
    }

    const filePath = path.relative(BASE_DIR, req.file.path).replace(/\\/g, '/');
    const parsedDuration = parseFloat(duration) || 0;

    const recording = await addRecording(
      dialogueId,
      playerId,
      roomId,
      filePath,
      parsedDuration
    );

    res.status(201).json(recording);
  } catch (error) {
    console.error('Kayıt yükleme hatası:', error);
    const message = error instanceof Error ? error.message : 'Kayıt yüklenemedi';
    res.status(500).json({ error: message });
  }
});

export default router;

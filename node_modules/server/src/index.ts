import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './socket/handlers.js';
import { ensureDirectories, cleanTempFiles } from './services/fileService.js';
import roomsRouter from './routes/rooms.js';
import scenesRouter from './routes/scenes.js';
import uploadRouter from './routes/upload.js';
import renderRouter from './routes/render.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';

// .env dosyasını yükle (proje root'undan)
const ROOT_DIR = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Express uygulaması
const app = express();
const httpServer = createServer(app);

// Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 10 * 1024 * 1024, // 10MB
});

// Express'e Socket.IO referansı ver (render route'unda kullanılacak)
app.set('io', io);

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik dosya servisi (proje root'undan)
app.use('/uploads', express.static(path.join(ROOT_DIR, process.env.UPLOAD_DIR || 'uploads')));
app.use('/renders', express.static(path.join(ROOT_DIR, process.env.RENDER_DIR || 'renders')));
app.use('/scenes', express.static(path.join(ROOT_DIR, process.env.SCENE_DIR || 'scenes')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/render', renderRouter);

// Sağlık kontrolü
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO handler'larını kaydet
registerSocketHandlers(io);

// Gerekli dizinleri oluştur
ensureDirectories();

// Başlangıçta 24 saatten eski dosyaları temizle ve her 6 saatte bir tekrarla
cleanTempFiles();
setInterval(() => {
  cleanTempFiles();
}, 6 * 60 * 60 * 1000);

// Sunucuyu başlat
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║          🎬 DublajLab Sunucu            ║
║                                          ║
║  Port: ${PORT}                             ║
║  URL:  http://localhost:${PORT}             ║
║  Client: ${CLIENT_URL}         ║
╚══════════════════════════════════════════╝
  `);
});

export { io };

import { Server, Socket } from 'socket.io';
import {
  addPlayer,
  removePlayer,
  getPlayerBySocketId,
  getRoomByCode,
  getRoomById,
  setRoomScene,
  updateRoomStatus,
  togglePlayerReady,
  assignCharacters,
  reassignHost,
  cleanEmptyRooms,
  areAllRecordingsComplete,
  getRoomPlayerCount,
} from '../services/roomService.js';
import { verifyToken } from '../utils/auth.js';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Bağlantı: ${socket.id}`);

    /**
     * Odaya katıl
     */
    socket.on('room:join', async (data: { roomCode: string; token: string }) => {
      try {
        const { roomCode, token } = data;

        if (!roomCode || !token) {
          socket.emit('error', { message: 'Oda kodu ve token gerekli' });
          return;
        }

        const user = verifyToken(token);
        if (!user) {
          socket.emit('error', { message: 'Geçersiz veya süresi dolmuş oturum. Lütfen tekrar giriş yapın.' });
          return;
        }

        const nickname = user.username;

        const room = await getRoomByCode(roomCode);
        if (!room) {
          socket.emit('error', { message: 'Bu oda artık mevcut değil' });
          return;
        }

        if (room.status !== 'waiting') {
          socket.emit('error', { message: 'Bu oda zaten oyunda, katılamazsınız' });
          return;
        }

        // Oyuncuyu odaya ekle
        const isHost = room.players.length === 0 && room.hostSocketId === socket.id;
        const player = await addPlayer(room.id, socket.id, nickname, isHost, user.id, user.avatarUrl);

        // Socket odasına katıl
        socket.join(room.id);

        // Güncel oda bilgisini al
        const updatedRoom = await getRoomById(room.id);

        // Katılan oyuncuya oda bilgisini gönder
        socket.emit('room:joined', {
          room: updatedRoom,
          playerId: player.id,
        });

        // Diğer oyunculara bildir
        socket.to(room.id).emit('room:playerJoined', {
          player,
          room: updatedRoom,
        });
      } catch (error) {
        console.error('room:join hatası:', error);
        socket.emit('error', { message: 'Odaya katılırken bir hata oluştu' });
      }
    });

    /**
     * Oda oluştur
     */
    socket.on('room:create', async (data: { token: string }) => {
      try {
        const { token } = data;

        if (!token) {
          socket.emit('error', { message: 'Oturum tokenı gerekli' });
          return;
        }

        const user = verifyToken(token);
        if (!user) {
          socket.emit('error', { message: 'Geçersiz veya süresi dolmuş oturum. Lütfen tekrar giriş yapın.' });
          return;
        }

        const nickname = user.username;

        // Oda oluştur (HTTP API yerine socket üzerinden de yapılabilir)
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        const { generateRoomCode } = await import('../utils/helpers.js');

        let code: string;
        let exists: boolean;
        do {
          code = generateRoomCode();
          const existingRoom = await prisma.room.findUnique({ where: { code } });
          exists = !!existingRoom;
        } while (exists);

        const room = await prisma.room.create({
          data: {
            code,
            hostSocketId: socket.id,
            status: 'waiting',
          },
        });

        // Host'u oyuncu olarak ekle
        const player = await addPlayer(room.id, socket.id, nickname, true, user.id, user.avatarUrl);

        // Socket odasına katıl
        socket.join(room.id);

        // Güncel oda bilgisini al
        const updatedRoom = await getRoomById(room.id);

        socket.emit('room:created', {
          room: updatedRoom,
          playerId: player.id,
        });

        await prisma.$disconnect();
      } catch (error) {
        console.error('room:create hatası:', error);
        socket.emit('error', { message: 'Oda oluşturulurken bir hata oluştu' });
      }
    });

    /**
     * Sahne seç (sadece host)
     */
    socket.on('room:selectScene', async (data: { roomId: string; sceneId: string }) => {
      try {
        const { roomId, sceneId } = data;
        const player = await getPlayerBySocketId(socket.id);

        if (!player || !player.isHost || player.roomId !== roomId) {
          socket.emit('error', { message: 'Bu işlem için yetkiniz yok' });
          return;
        }

        await setRoomScene(roomId, sceneId);
        const updatedRoom = await getRoomById(roomId);

        io.to(roomId).emit('room:sceneSelected', { room: updatedRoom });
      } catch (error) {
        console.error('room:selectScene hatası:', error);
        socket.emit('error', { message: 'Sahne seçilirken bir hata oluştu' });
      }
    });

    /**
     * Hazır durumunu değiştir
     */
    socket.on('room:toggleReady', async (data: { roomId: string; playerId: string; isReady: boolean }) => {
      try {
        const { roomId, playerId, isReady } = data;
        const player = await getPlayerBySocketId(socket.id);

        if (!player || player.id !== playerId) {
          socket.emit('error', { message: 'Geçersiz oyuncu' });
          return;
        }

        await togglePlayerReady(playerId, isReady);
        const updatedRoom = await getRoomById(roomId);

        io.to(roomId).emit('room:updated', { room: updatedRoom });
      } catch (error) {
        console.error('room:toggleReady hatası:', error);
        socket.emit('error', { message: 'Durum güncellenirken bir hata oluştu' });
      }
    });

    /**
     * Oyunu başlat (sadece host) - karakter dağıtımı ve oyun başlangıcı
     */
    socket.on('room:startGame', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        const player = await getPlayerBySocketId(socket.id);

        if (!player || !player.isHost || player.roomId !== roomId) {
          socket.emit('error', { message: 'Bu işlem için yetkiniz yok' });
          return;
        }

        const room = await getRoomById(roomId);
        if (!room || !room.sceneId) {
          socket.emit('error', { message: 'Önce bir sahne seçmelisiniz' });
          return;
        }

        // Karakterleri dağıt
        const updatedRoom = await assignCharacters(roomId);

        // Oda durumunu güncelle
        await updateRoomStatus(roomId, 'recording');

        const finalRoom = await getRoomById(roomId);

        io.to(roomId).emit('room:gameStarted', { room: finalRoom });
      } catch (error) {
        console.error('room:startGame hatası:', error);
        socket.emit('error', { message: 'Oyun başlatılırken bir hata oluştu' });
      }
    });

    /**
     * Kayıt tamamlandı bildirimi
     */
    socket.on('recording:completed', async (data: { roomId: string; dialogueId: string }) => {
      try {
        const { roomId, dialogueId } = data;

        // Diğer oyunculara bildir
        socket.to(roomId).emit('recording:playerCompleted', {
          socketId: socket.id,
          dialogueId,
        });

        // Tüm kayıtlar tamamlandı mı kontrol et
        const allComplete = await areAllRecordingsComplete(roomId);
        if (allComplete) {
          io.to(roomId).emit('recording:allCompleted', { roomId });
        }
      } catch (error) {
        console.error('recording:completed hatası:', error);
      }
    });

    /**
     * Odadan ayrıl
     */
    socket.on('room:leave', async () => {
      await handleDisconnect(socket, io);
    });

    /**
     * Bağlantı kopması
     */
    socket.on('disconnect', async () => {
      console.log(`Bağlantı koptu: ${socket.id}`);
      await handleDisconnect(socket, io);
    });
  });

  // Periyodik temizlik (her 30 dakikada)
  setInterval(() => {
    cleanEmptyRooms().catch(console.error);
  }, 30 * 60 * 1000);
}

/**
 * Oyuncu ayrıldığında yapılacak işlemler
 */
async function handleDisconnect(socket: Socket, io: Server) {
  try {
    const player = await getPlayerBySocketId(socket.id);
    if (!player) return;

    const roomId = player.roomId;
    const wasHost = player.isHost;

    await removePlayer(socket.id);
    socket.leave(roomId);

    const playerCount = await getRoomPlayerCount(roomId);

    if (playerCount === 0) {
      // Oda boş kaldı - temizle
      await cleanEmptyRooms();
      return;
    }

    // Host ayrıldıysa yeni host ata
    if (wasHost) {
      const newHost = await reassignHost(roomId);
      if (newHost) {
        io.to(roomId).emit('room:hostChanged', {
          newHostId: newHost.id,
          newHostSocketId: newHost.socketId,
        });
      }
    }

    // Güncel oda bilgisini gönder
    const updatedRoom = await getRoomById(roomId);
    io.to(roomId).emit('room:playerLeft', {
      socketId: socket.id,
      room: updatedRoom,
    });
  } catch (error) {
    console.error('disconnect hatası:', error);
  }
}

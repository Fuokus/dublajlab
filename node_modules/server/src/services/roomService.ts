import { PrismaClient } from '@prisma/client';
import { generateRoomCode } from '../utils/helpers.js';

const prisma = new PrismaClient();

/**
 * Benzersiz oda kodu üretir (çakışma olmayana kadar tekrar dener)
 */
async function generateUniqueCode(): Promise<string> {
  let code: string;
  let exists: boolean;
  let attempts = 0;

  do {
    code = generateRoomCode();
    const room = await prisma.room.findUnique({ where: { code } });
    exists = !!room;
    attempts++;
    if (attempts > 100) {
      throw new Error('Benzersiz oda kodu üretilemedi');
    }
  } while (exists);

  return code;
}

/**
 * Yeni oda oluşturur
 */
export async function createRoom(hostSocketId: string) {
  const code = await generateUniqueCode();

  const room = await prisma.room.create({
    data: {
      code,
      hostSocketId,
      status: 'waiting',
    },
  });

  return room;
}

/**
 * Oda koduna göre odayı getirir
 */
export async function getRoomByCode(code: string) {
  return prisma.room.findUnique({
    where: { code: code.toUpperCase() },
    include: {
      scene: {
        include: {
          characters: {
            include: { dialogues: { orderBy: { orderIndex: 'asc' } } },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
      players: {
        include: {
          character: {
            include: { dialogues: { orderBy: { orderIndex: 'asc' } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Oda ID'sine göre odayı getirir
 */
export async function getRoomById(id: string) {
  return prisma.room.findUnique({
    where: { id },
    include: {
      scene: {
        include: {
          characters: {
            include: { dialogues: { orderBy: { orderIndex: 'asc' } } },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
      players: {
        include: {
          character: {
            include: { dialogues: { orderBy: { orderIndex: 'asc' } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Odaya oyuncu ekler
 */
export async function addPlayer(
  roomId: string, 
  socketId: string, 
  nickname: string, 
  isHost: boolean,
  discordId?: string,
  avatarUrl?: string
) {
  return prisma.player.create({
    data: {
      roomId,
      socketId,
      nickname,
      isHost,
      discordId,
      avatarUrl
    },
  });
}

/**
 * Socket ID'sine göre oyuncuyu bulur
 */
export async function getPlayerBySocketId(socketId: string) {
  return prisma.player.findFirst({
    where: { socketId },
    include: { room: true, character: true },
  });
}

/**
 * Oyuncuyu odadan çıkarır
 */
export async function removePlayer(socketId: string) {
  const player = await prisma.player.findFirst({ where: { socketId } });
  if (player) {
    await prisma.player.delete({ where: { id: player.id } });
  }
  return player;
}

/**
 * Odanın sahnesini günceller
 */
export async function setRoomScene(roomId: string, sceneId: string) {
  return prisma.room.update({
    where: { id: roomId },
    data: { sceneId },
  });
}

/**
 * Oda durumunu günceller
 */
export async function updateRoomStatus(roomId: string, status: string) {
  return prisma.room.update({
    where: { id: roomId },
    data: { status },
  });
}

/**
 * Oyuncunun hazır durumunu günceller
 */
export async function togglePlayerReady(playerId: string, isReady: boolean) {
  return prisma.player.update({
    where: { id: playerId },
    data: { isReady },
  });
}

/**
 * Karakterleri oyunculara dağıtır
 */
export async function assignCharacters(roomId: string) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      scene: {
        include: {
          characters: { orderBy: { orderIndex: 'asc' } },
        },
      },
      players: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!room || !room.scene) {
    throw new Error('Oda veya sahne bulunamadı');
  }

  const characters = room.scene.characters;
  const players = room.players;

  if (players.length === 0) {
    throw new Error('Odada oyuncu yok');
  }

  // Her oyuncuya sırayla karakter ata (round-robin)
  const assignments: { playerId: string; characterId: string }[] = [];

  for (let i = 0; i < characters.length; i++) {
    const playerIndex = i % players.length;
    assignments.push({
      playerId: players[playerIndex].id,
      characterId: characters[i].id,
    });
  }

  // Eğer karakter sayısından fazla oyuncu varsa, fazla oyuncuları seyirci olarak bırak
  // Önce tüm atamaları sıfırla
  await prisma.player.updateMany({
    where: { roomId },
    data: { characterId: null },
  });

  // Atamaları uygula - her oyuncuya ilk karakter atanır
  // Round-robin: birden fazla karakter alacak oyuncuları takip etmeliyiz
  // Ancak prisma'da bir oyuncunun sadece bir characterId'si var
  // Bu durumda: her oyuncuya bir karakter ata, fazla karakterler için oyuncu tekrarla
  // MVP için: her oyuncuya en fazla bir karakter ata
  for (let i = 0; i < Math.min(characters.length, players.length); i++) {
    await prisma.player.update({
      where: { id: players[i].id },
      data: { characterId: characters[i].id },
    });
  }

  return getRoomById(roomId);
}

/**
 * Oyuncu sayısını al
 */
export async function getRoomPlayerCount(roomId: string): Promise<number> {
  return prisma.player.count({ where: { roomId } });
}

/**
 * Host'u güncelle (ilk kalan oyuncu host olur)
 */
export async function reassignHost(roomId: string) {
  const players = await prisma.player.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' },
  });

  if (players.length > 0) {
    await prisma.player.update({
      where: { id: players[0].id },
      data: { isHost: true },
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { hostSocketId: players[0].socketId },
    });

    return players[0];
  }

  return null;
}

/**
 * Boş odaları temizle
 */
export async function cleanEmptyRooms() {
  const emptyRooms = await prisma.room.findMany({
    where: {
      players: { none: {} },
    },
    select: { id: true },
  });

  if (emptyRooms.length > 0) {
    await prisma.room.deleteMany({
      where: { id: { in: emptyRooms.map((r) => r.id) } },
    });
    console.log(`${emptyRooms.length} boş oda temizlendi`);
  }
}

/**
 * Odadaki tüm kayıtları getir
 */
export async function getRoomRecordings(roomId: string) {
  return prisma.recording.findMany({
    where: { roomId },
    include: {
      dialogue: true,
      player: true,
    },
  });
}

/**
 * Kayıt ekle
 */
export async function addRecording(
  dialogueId: string,
  playerId: string,
  roomId: string,
  filePath: string,
  duration: number
) {
  // Aynı diyalog + oyuncu + oda için eski kaydı sil
  await prisma.recording.deleteMany({
    where: { dialogueId, playerId, roomId },
  });

  return prisma.recording.create({
    data: { dialogueId, playerId, roomId, filePath, duration },
  });
}

/**
 * Odanın tüm diyalogları için kayıt yapılıp yapılmadığını kontrol eder
 */
export async function areAllRecordingsComplete(roomId: string): Promise<boolean> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      scene: {
        include: {
          characters: {
            include: { dialogues: true },
          },
        },
      },
      players: true,
    },
  });

  if (!room || !room.scene) return false;

  // Atanmış karakterlerin diyaloglarını topla
  const assignedCharacterIds = room.players
    .filter((p) => p.characterId)
    .map((p) => p.characterId!);

  const requiredDialogues = room.scene.characters
    .filter((c) => assignedCharacterIds.includes(c.id))
    .flatMap((c) => c.dialogues);

  if (requiredDialogues.length === 0) return false;

  const recordings = await prisma.recording.findMany({
    where: { roomId },
  });

  const recordedDialogueIds = new Set(recordings.map((r) => r.dialogueId));
  return requiredDialogues.every((d) => recordedDialogueIds.has(d.id));
}

export { prisma };

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı seed işlemi başlatılıyor...');

  // Mevcut verileri temizle
  await prisma.recording.deleteMany();
  await prisma.render.deleteMany();
  await prisma.player.deleteMany();
  await prisma.dialogue.deleteMany();
  await prisma.character.deleteMany();
  await prisma.room.deleteMany();
  await prisma.scene.deleteMany();

  // Örnek Sahne 1: Kısa Diyalog
  const scene1 = await prisma.scene.create({
    data: {
      name: 'Kahve Molası',
      description: 'İki arkadaş kahve molasında sohbet ediyor. Kısa ve eğlenceli bir sahne.',
      videoPath: 'scenes/demo-scene.mp4',
      audioMode: 'muted',
      characters: {
        create: [
          {
            name: 'Ali',
            orderIndex: 0,
            dialogues: {
              create: [
                {
                  text: 'Bugün hava çok güzel, değil mi?',
                  startTime: 2.0,
                  endTime: 4.5,
                  orderIndex: 0,
                },
                {
                  text: 'Ben de öyle düşünüyorum. Hadi dışarı çıkalım!',
                  startTime: 7.0,
                  endTime: 10.0,
                  orderIndex: 1,
                },
              ],
            },
          },
          {
            name: 'Ayşe',
            orderIndex: 1,
            dialogues: {
              create: [
                {
                  text: 'Evet, harika bir gün! Parkta yürüyüş yapalım mı?',
                  startTime: 4.8,
                  endTime: 7.0,
                  orderIndex: 0,
                },
                {
                  text: 'Harika fikir! Hemen hazırlanayım.',
                  startTime: 10.5,
                  endTime: 12.5,
                  orderIndex: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Örnek Sahne 2: Üç Kişilik Diyalog
  const scene2 = await prisma.scene.create({
    data: {
      name: 'Ekip Toplantısı',
      description: 'Üç kişilik bir ekip yeni projeyi tartışıyor. Eğlenceli ve dramatik bir sahne.',
      videoPath: 'scenes/demo-scene-2.mp4',
      audioMode: 'muted',
      characters: {
        create: [
          {
            name: 'Müdür',
            orderIndex: 0,
            dialogues: {
              create: [
                {
                  text: 'Arkadaşlar, yeni projemizi konuşmamız lazım.',
                  startTime: 1.0,
                  endTime: 3.5,
                  orderIndex: 0,
                },
                {
                  text: 'Harika! O zaman başlayalım.',
                  startTime: 8.0,
                  endTime: 9.5,
                  orderIndex: 1,
                },
              ],
            },
          },
          {
            name: 'Geliştirici',
            orderIndex: 1,
            dialogues: {
              create: [
                {
                  text: 'Ben backend tarafını hallederim.',
                  startTime: 4.0,
                  endTime: 5.8,
                  orderIndex: 0,
                },
                {
                  text: 'İki haftada bitiririm!',
                  startTime: 10.0,
                  endTime: 11.5,
                  orderIndex: 1,
                },
              ],
            },
          },
          {
            name: 'Tasarımcı',
            orderIndex: 2,
            dialogues: {
              create: [
                {
                  text: 'UI tasarımı bende, çok güzel olacak.',
                  startTime: 6.0,
                  endTime: 8.0,
                  orderIndex: 0,
                },
                {
                  text: 'Renkleri ve fontları hemen seçeyim.',
                  startTime: 12.0,
                  endTime: 14.0,
                  orderIndex: 1,
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`Sahne oluşturuldu: ${scene1.name} (${scene1.id})`);
  console.log(`Sahne oluşturuldu: ${scene2.name} (${scene2.id})`);
  console.log('Seed işlemi tamamlandı!');
}

main()
  .catch((e) => {
    console.error('Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

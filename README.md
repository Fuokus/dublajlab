# 🎬 DublajLab

Arkadaşlarınla sahneleri kendi sesinizle yeniden dublajla.

## Özellikler

- 🎤 Gerçek zamanlı çok oyunculu dublaj odaları
- 🎭 Otomatik karakter dağıtımı
- 🎙️ Tarayıcı tabanlı mikrofon kaydı
- 🎬 FFmpeg ile otomatik video render
- 🔗 6 haneli oda kodları ile kolay paylaşım

## Gereksinimler

- **Node.js** v18+ ([nodejs.org](https://nodejs.org))
- **npm** v9+
- **FFmpeg** (video render için)

### Windows'ta FFmpeg Kurulumu

1. [https://www.gyan.dev/ffmpeg/builds/](https://www.gyan.dev/ffmpeg/builds/) adresinden **ffmpeg-release-essentials.zip** dosyasını indirin.
2. ZIP dosyasını bir klasöre çıkarın (örneğin `C:\ffmpeg`).
3. `C:\ffmpeg\bin` klasörünü sistem PATH'ine ekleyin:
   - **Windows Tuşu** > "Ortam değişkenleri" yazın > "Sistem ortam değişkenlerini düzenle" seçin
   - **Ortam Değişkenleri** butonuna tıklayın
   - **Path** değişkenini seçip **Düzenle** butonuna tıklayın
   - **Yeni** butonuna tıklayıp `C:\ffmpeg\bin` yazın
   - **Tamam** ile kapatın
4. Yeni bir terminal açıp doğrulayın:
   ```bash
   ffmpeg -version
   ```

## Kurulum

```bash
# Projeyi klonlayın veya indirin
cd dublajlab

# Bağımlılıkları kurun
npm install

# Veritabanını oluşturun ve örnek verileri ekleyin
npm run db:setup
```

## Çalıştırma

```bash
# Frontend ve backend'i aynı anda başlatın
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

### Ayrı ayrı başlatma

```bash
# Sadece backend
npm run dev:server

# Sadece frontend
npm run dev:client
```

## Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın ve gerekli ayarları yapın:

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| PORT | 3001 | Sunucu portu |
| DATABASE_URL | file:../data/dublajlab.db | SQLite veritabanı yolu |
| UPLOAD_DIR | uploads | Ses kayıtları dizini |
| RENDER_DIR | renders | Render çıktıları dizini |
| SCENE_DIR | scenes | Sahne videoları dizini |
| CLIENT_URL | http://localhost:5173 | Frontend URL (CORS) |

## Kullanım

1. Tarayıcıda http://localhost:5173 adresini açın
2. Bir nickname girin
3. **Oda Oluştur** butonuna tıklayın
4. Oda kodunu arkadaşlarınızla paylaşın
5. Bir sahne seçin ve oyunu başlatın
6. Her oyuncu kendi karakterinin repliklerini kaydetsin
7. Tüm kayıtlar tamamlandığında **Final Videoyu Oluştur** butonuna tıklayın
8. Dublajlı videoyu izleyin ve indirin!

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Gerçek Zamanlı | Socket.IO |
| Veritabanı | SQLite + Prisma ORM |
| Video/Ses | FFmpeg |

## Lisans

MIT

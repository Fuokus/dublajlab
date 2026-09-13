import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';

const router = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:3001/api/auth/discord/callback';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dublajlab_key';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Discord'a yönlendirme rotası
router.get('/discord', (req, res) => {
  if (!DISCORD_CLIENT_ID) {
    return res.status(500).json({ error: 'Discord Client ID bulunamadı. Lütfen .env dosyasını kontrol edin.' });
  }
  
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    DISCORD_REDIRECT_URI
  )}&response_type=code&scope=identify`;

  res.redirect(discordAuthUrl);
});

// Discord'dan dönen callback rotası
router.get('/discord/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${CLIENT_URL}?error=Discord_Giris_Iptal_Edildi`);
  }

  try {
    // 1. Kodu Access Token ile değiştir
    const params = new URLSearchParams();
    params.append('client_id', DISCORD_CLIENT_ID!);
    params.append('client_secret', DISCORD_CLIENT_SECRET!);
    params.append('grant_type', 'authorization_code');
    params.append('code', code.toString());
    params.append('redirect_uri', DISCORD_REDIRECT_URI);

    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const accessToken = tokenResponse.data.access_token;

    // 2. Access Token ile kullanıcı bilgilerini al
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = userResponse.data;
    
    // Avatar URL'sini oluştur
    const avatarUrl = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || '0') % 5}.png`;

    // 3. Kendi sistemimiz için JWT oluştur
    const token = jwt.sign(
      {
        id: userData.id,
        username: userData.global_name || userData.username,
        avatarUrl,
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Token 7 gün geçerli olsun
    );

    // 4. Frontend'e token ile yönlendir
    // Token'i query parametresi olarak gönderiyoruz. Frontend bunu alıp localStorage'a kaydedecek.
    res.redirect(`${CLIENT_URL}?token=${token}`);
  } catch (error) {
    console.error('Discord Auth Hatası:', error);
    res.redirect(`${CLIENT_URL}?error=Discord_Giris_Basarisiz`);
  }
});

export default router;

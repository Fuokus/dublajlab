import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz erişim (Token eksik)' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }

  if (decoded.id !== process.env.ADMIN_DISCORD_ID) {
    return res.status(403).json({ error: 'Yönetici yetkisi reddedildi' });
  }

  // Admin onaylandı
  next();
};

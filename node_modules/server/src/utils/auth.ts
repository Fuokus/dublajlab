import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dublajlab_key';

export interface DecodedUser {
  id: string; // Discord ID
  username: string; // Discord Username
  avatarUrl: string; // Discord Avatar URL
}

export function verifyToken(token: string): DecodedUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedUser;
    return decoded;
  } catch (error) {
    return null;
  }
}

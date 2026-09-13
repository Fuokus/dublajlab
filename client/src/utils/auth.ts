import { jwtDecode } from 'jwt-decode';

export interface DiscordUser {
  id: string;
  username: string;
  avatarUrl: string;
}

export function saveToken(token: string) {
  localStorage.setItem('dublajlab_token', token);
}

export function getToken(): string | null {
  return localStorage.getItem('dublajlab_token');
}

export function removeToken() {
  localStorage.removeItem('dublajlab_token');
}

export function getUser(): DiscordUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<DiscordUser & { exp: number }>(token);
    
    // Süresi dolmuş mu kontrol et
    if (decoded.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }
    
    return {
      id: decoded.id,
      username: decoded.username,
      avatarUrl: decoded.avatarUrl,
    };
  } catch (e) {
    removeToken();
    return null;
  }
}

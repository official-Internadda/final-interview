import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'internadda_admin_token';
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'internadda-super-secret-admin-token-2026';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function setAdminSession(username: string) {
  const cookieStore = await cookies();
  const token = Buffer.from(JSON.stringify({ username, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64');
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 // 24 hours
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return false;

  try {
    const payload = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));
    if (payload.exp && payload.exp > Date.now()) {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

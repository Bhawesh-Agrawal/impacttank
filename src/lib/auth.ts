import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'event2026';
const COOKIE_NAME = 'pitch_admin_auth';

export function getAdminCredentials() {
  return {
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  };
}

export function checkCredentials(user: string, pass: string): boolean {
  return (
    user.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
    pass.trim() === ADMIN_PASSWORD
  );
}

// Generate simple opaque token based on credentials
export function generateToken(): string {
  const payload = `${ADMIN_USERNAME}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

export function isValidToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [user] = decoded.split(':');
    return user.toLowerCase() === ADMIN_USERNAME.toLowerCase();
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return isValidToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;

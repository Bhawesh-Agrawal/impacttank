import { cookies } from 'next/headers';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE_NAME = 'impact_admin_auth_v2';

export function checkCredentials(user: string, pass: string): boolean {
  if (!ADMIN_PASSWORD) {
    return false;
  }
  return (
    user.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() &&
    pass.trim() === ADMIN_PASSWORD
  );
}

function signPayload(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Generate cryptographically signed token bound to the current ADMIN_PASSWORD
export function generateToken(): string {
  if (!ADMIN_PASSWORD) return '';
  const timestamp = Date.now().toString();
  const signature = signPayload(`${ADMIN_USERNAME}:${timestamp}`, ADMIN_PASSWORD);
  const payload = `${ADMIN_USERNAME}:${timestamp}:${signature}`;
  return Buffer.from(payload).toString('base64');
}

export function isValidToken(token: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 3) return false;
    const [user, timestamp, signature] = parts;
    if (!user || !timestamp || !signature) return false;
    if (user.toLowerCase() !== ADMIN_USERNAME.toLowerCase()) return false;

    // Verify token HMAC signature against current password
    const expectedSignature = signPayload(`${user}:${timestamp}`, ADMIN_PASSWORD);
    const sigBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
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

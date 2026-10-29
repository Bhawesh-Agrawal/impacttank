import { NextResponse } from 'next/server';
import { isAuthenticated, getAdminCredentials } from '@/lib/auth';

export async function GET() {
  const authed = await isAuthenticated();
  const creds = getAdminCredentials();

  return NextResponse.json({
    authenticated: authed,
    defaultUsername: creds.username,
  });
}

import { NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/db';

export async function GET() {
  try {
    const status = await getDatabaseStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to query database status';
    return NextResponse.json({
      provider: 'unknown',
      connected: false,
      message,
    });
  }
}

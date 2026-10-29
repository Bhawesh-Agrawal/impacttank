import { NextResponse } from 'next/server';
import { clearAllVotes } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function POST() {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    await clearAllVotes();
    return NextResponse.json({ success: true, message: 'All votes have been cleared successfully.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to clear votes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

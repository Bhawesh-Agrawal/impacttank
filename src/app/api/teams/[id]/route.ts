import { NextRequest, NextResponse } from 'next/server';
import { updateTeam, deleteTeam } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updated = await updateTeam(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, team: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update team';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteTeam(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Team deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete team';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

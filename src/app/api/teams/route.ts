import { NextRequest, NextResponse } from 'next/server';
import { getTeams, createTeam } from '@/lib/db';
import { isAuthenticated } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const onlyActive = searchParams.get('active') === 'true';
    const stall = searchParams.get('stall');

    let teams = await getTeams(onlyActive);
    if (stall && stall !== 'all') {
      teams = teams.filter((t) => t.stall.toLowerCase() === stall.toLowerCase());
    }

    return NextResponse.json({ teams });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch teams';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authed = await isAuthenticated();
    if (!authed) {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const body = await req.json();
    const { name, pitchTitle, description, stall, category, members, active } = body;

    if (!name || !pitchTitle || !stall) {
      return NextResponse.json(
        { error: 'Team name, pitch title, and stall are required' },
        { status: 400 }
      );
    }

    const newTeam = await createTeam({
      name: name.trim(),
      pitchTitle: pitchTitle.trim(),
      description: description?.trim() || '',
      stall: stall.trim(),
      category: category?.trim() || 'General Pitch',
      members: members?.trim() || '',
      active: active !== undefined ? Boolean(active) : true,
    });

    return NextResponse.json({ success: true, team: newTeam }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create team';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

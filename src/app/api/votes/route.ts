import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard, getVotes, submitVote } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId') || undefined;
    const includeRawVotes = searchParams.get('includeVotes') === 'true';

    const leaderboard = await getLeaderboard();
    const votes = includeRawVotes ? await getVotes(teamId) : [];

    const totalVotes = votes.length > 0 
      ? votes.length 
      : leaderboard.reduce((acc, curr) => acc + curr.totalVotes, 0);

    return NextResponse.json({
      leaderboard,
      totalVotes,
      votes,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch vote data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if body is a batch submission
    const rawVotes = Array.isArray(body)
      ? body
      : Array.isArray(body.votes)
      ? body.votes
      : null;

    if (rawVotes) {
      if (rawVotes.length === 0) {
        return NextResponse.json(
          { error: 'At least one vote is required' },
          { status: 400 }
        );
      }

      const sessionId =
        body.visitorSessionId ||
        `anon-guest-${Math.random().toString(36).substring(2, 9)}`;

      const results = [];
      for (const item of rawVotes) {
        const { teamId, stall, rating, overallRating } = item;
        const score = Number(rating ?? overallRating);
        if (!teamId || !stall || !score || score < 1 || score > 5) {
          continue;
        }

        const saved = await submitVote({
          teamId,
          stall,
          innovationRating: score,
          presentationRating: score,
          viabilityRating: score,
          overallRating: score,
          tags: [],
          feedback: '',
          visitorSessionId: item.visitorSessionId || sessionId,
        });
        results.push(saved);
      }

      return NextResponse.json(
        {
          success: true,
          message: `${results.length} ratings submitted successfully!`,
          votes: results,
        },
        { status: 201 }
      );
    }

    // Single vote payload
    const {
      teamId,
      stall,
      rating,
      innovationRating,
      presentationRating,
      viabilityRating,
      overallRating,
      tags,
      feedback,
      visitorSessionId,
    } = body;

    if (!teamId || !stall) {
      return NextResponse.json(
        { error: 'Team ID and stall number are required' },
        { status: 400 }
      );
    }

    const singleRating = rating !== undefined ? Number(rating) : (overallRating !== undefined ? Number(overallRating) : undefined);
    const inno = innovationRating !== undefined ? Number(innovationRating) : singleRating;
    const pres = presentationRating !== undefined ? Number(presentationRating) : singleRating;
    const viab = viabilityRating !== undefined ? Number(viabilityRating) : singleRating;
    const ovr = singleRating ?? (inno && pres && viab ? (inno + pres + viab) / 3 : undefined);

    if (!ovr || ovr < 1 || ovr > 5) {
      return NextResponse.json(
        { error: 'A rating between 1 and 5 stars is required' },
        { status: 400 }
      );
    }

    const sessionId = visitorSessionId || `anon-guest-${Math.random().toString(36).substring(2, 9)}`;

    const savedVote = await submitVote({
      teamId,
      stall,
      innovationRating: inno || ovr,
      presentationRating: pres || ovr,
      viabilityRating: viab || ovr,
      overallRating: ovr,
      tags: Array.isArray(tags) ? tags : [],
      feedback: typeof feedback === 'string' ? feedback : '',
      visitorSessionId: sessionId,
    });

    return NextResponse.json(
      { success: true, message: 'Rating submitted successfully!', vote: savedVote },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record rating';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

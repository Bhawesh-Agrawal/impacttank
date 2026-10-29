import fs from 'fs';
import path from 'path';
import { getPostgresPool, isPostgresConfigured } from './postgres';
import { supabase, isSupabaseConfigured } from './supabase';
import { Team, Vote, LeaderboardEntry, DatabaseStatus } from './types';
import seedTeams from '../data/seed.json';

interface LocalDatabase {
  teams: Team[];
  votes: Vote[];
}

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Helper to ensure local database exists
function getLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: LocalDatabase = {
        teams: seedTeams as Team[],
        votes: [],
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content) as LocalDatabase;
  } catch (err) {
    console.error('Error reading local db:', err);
    return {
      teams: seedTeams as Team[],
      votes: [],
    };
  }
}

function saveLocalDb(data: LocalDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local db:', err);
  }
}

// Check database status
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const pool = getPostgresPool();
  if (pool) {
    try {
      const res = await pool.query('SELECT 1;');
      if (res) {
        return {
          provider: 'supabase',
          connected: true,
          message: 'Connected to Supabase PostgreSQL Cloud Database',
        };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return {
        provider: 'supabase',
        connected: false,
        message: `Supabase PostgreSQL error: ${msg} (Using local fallback)`,
      };
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('teams').select('id').limit(1);
      if (!error) {
        return {
          provider: 'supabase',
          connected: true,
          message: 'Connected to Supabase REST API',
        };
      }
      return {
        provider: 'supabase',
        connected: false,
        message: `Supabase connection issue: ${error.message} (Using local fallback)`,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return {
        provider: 'supabase',
        connected: false,
        message: `Supabase error: ${msg} (Using local fallback)`,
      };
    }
  }

  return {
    provider: 'local',
    connected: true,
    message: 'Local Storage Mode',
  };
}

// ----------------- TEAMS OPERATIONS -----------------

export async function getTeams(onlyActive = false): Promise<Team[]> {
  const pool = getPostgresPool();
  if (pool) {
    try {
      const query = onlyActive
        ? 'SELECT * FROM teams WHERE active = true ORDER BY created_at ASC;'
        : 'SELECT * FROM teams ORDER BY created_at ASC;';
      const res = await pool.query(query);
      return res.rows.map((row) => ({
        id: row.id,
        name: row.name,
        pitchTitle: row.pitch_title,
        description: row.description || '',
        stall: row.stall,
        category: row.category,
        members: row.members || '',
        active: Boolean(row.active),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Supabase PostgreSQL getTeams failed, falling back to local:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('teams').select('*').order('created_at', { ascending: true });
      if (onlyActive) {
        query = query.eq('active', true);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((t) => ({
          id: t.id,
          name: t.name,
          pitchTitle: t.pitch_title || t.pitchTitle,
          description: t.description,
          stall: t.stall,
          category: t.category,
          members: t.members,
          active: t.active,
          createdAt: t.created_at || t.createdAt,
        }));
      }
    } catch (err) {
      console.warn('Supabase getTeams failed, falling back to local:', err);
    }
  }

  const local = getLocalDb();
  if (onlyActive) {
    return local.teams.filter((t) => t.active);
  }
  return local.teams;
}

export async function createTeam(teamData: Omit<Team, 'id' | 'createdAt'>): Promise<Team> {
  const newTeam: Team = {
    ...teamData,
    id: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  const pool = getPostgresPool();
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO teams (id, name, pitch_title, description, stall, category, members, active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *;`,
        [
          newTeam.id,
          newTeam.name,
          newTeam.pitchTitle,
          newTeam.description,
          newTeam.stall,
          newTeam.category,
          newTeam.members || '',
          newTeam.active,
          newTeam.createdAt,
        ]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          name: row.name,
          pitchTitle: row.pitch_title,
          description: row.description,
          stall: row.stall,
          category: row.category,
          members: row.members,
          active: row.active,
          createdAt: row.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase PostgreSQL createTeam failed, falling back:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          id: newTeam.id,
          name: newTeam.name,
          pitch_title: newTeam.pitchTitle,
          description: newTeam.description,
          stall: newTeam.stall,
          category: newTeam.category,
          members: newTeam.members,
          active: newTeam.active,
          created_at: newTeam.createdAt,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          pitchTitle: data.pitch_title,
          description: data.description,
          stall: data.stall,
          category: data.category,
          members: data.members,
          active: data.active,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase createTeam failed, saving locally:', err);
    }
  }

  const local = getLocalDb();
  local.teams.push(newTeam);
  saveLocalDb(local);
  return newTeam;
}

export async function updateTeam(id: string, patch: Partial<Team>): Promise<Team | null> {
  const pool = getPostgresPool();
  if (pool) {
    try {
      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (patch.name !== undefined) { fields.push(`name = $${idx++}`); values.push(patch.name); }
      if (patch.pitchTitle !== undefined) { fields.push(`pitch_title = $${idx++}`); values.push(patch.pitchTitle); }
      if (patch.description !== undefined) { fields.push(`description = $${idx++}`); values.push(patch.description); }
      if (patch.stall !== undefined) { fields.push(`stall = $${idx++}`); values.push(patch.stall); }
      if (patch.category !== undefined) { fields.push(`category = $${idx++}`); values.push(patch.category); }
      if (patch.members !== undefined) { fields.push(`members = $${idx++}`); values.push(patch.members); }
      if (patch.active !== undefined) { fields.push(`active = $${idx++}`); values.push(patch.active); }

      if (fields.length > 0) {
        values.push(id);
        const res = await pool.query(
          `UPDATE teams SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`,
          values
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            name: row.name,
            pitchTitle: row.pitch_title,
            description: row.description,
            stall: row.stall,
            category: row.category,
            members: row.members,
            active: row.active,
            createdAt: row.created_at,
          };
        }
      }
    } catch (err) {
      console.warn('Supabase PostgreSQL updateTeam failed, falling back:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const updates: Record<string, unknown> = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.pitchTitle !== undefined) updates.pitch_title = patch.pitchTitle;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.stall !== undefined) updates.stall = patch.stall;
      if (patch.category !== undefined) updates.category = patch.category;
      if (patch.members !== undefined) updates.members = patch.members;
      if (patch.active !== undefined) updates.active = patch.active;

      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          pitchTitle: data.pitch_title,
          description: data.description,
          stall: data.stall,
          category: data.category,
          members: data.members,
          active: data.active,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase updateTeam failed, updating locally:', err);
    }
  }

  const local = getLocalDb();
  const index = local.teams.findIndex((t) => t.id === id);
  if (index === -1) return null;

  local.teams[index] = { ...local.teams[index], ...patch };
  saveLocalDb(local);
  return local.teams[index];
}

export async function deleteTeam(id: string): Promise<boolean> {
  const pool = getPostgresPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM teams WHERE id = $1;', [id]);
      return true;
    } catch (err) {
      console.warn('Supabase PostgreSQL deleteTeam failed, falling back:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('votes').delete().eq('team_id', id);
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (!error) return true;
    } catch (err) {
      console.warn('Supabase deleteTeam failed, falling back to local:', err);
    }
  }

  const local = getLocalDb();
  const initialLen = local.teams.length;
  local.teams = local.teams.filter((t) => t.id !== id);
  local.votes = local.votes.filter((v) => v.teamId !== id);
  saveLocalDb(local);
  return local.teams.length < initialLen;
}

// ----------------- VOTING OPERATIONS -----------------

export async function submitVote(voteData: {
  teamId: string;
  stall: string;
  innovationRating: number;
  presentationRating: number;
  viabilityRating: number;
  overallRating?: number;
  tags?: string[];
  feedback?: string;
  visitorSessionId: string;
}): Promise<Vote> {
  const computedOverall =
    voteData.overallRating ||
    Number(
      (
        (voteData.innovationRating +
          voteData.presentationRating +
          voteData.viabilityRating) /
        3
      ).toFixed(1)
    );

  const newVote: Vote = {
    id: `vote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    teamId: voteData.teamId,
    stall: voteData.stall,
    innovationRating: Math.min(5, Math.max(1, voteData.innovationRating)),
    presentationRating: Math.min(5, Math.max(1, voteData.presentationRating)),
    viabilityRating: Math.min(5, Math.max(1, voteData.viabilityRating)),
    overallRating: Math.min(5, Math.max(1, computedOverall)),
    tags: voteData.tags || [],
    feedback: voteData.feedback?.trim() || '',
    visitorSessionId: voteData.visitorSessionId,
    createdAt: new Date().toISOString(),
  };

  const pool = getPostgresPool();
  if (pool) {
    try {
      const res = await pool.query(
        `INSERT INTO votes (id, team_id, stall, innovation_rating, presentation_rating, viability_rating, overall_rating, tags, feedback, visitor_session_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *;`,
        [
          newVote.id,
          newVote.teamId,
          newVote.stall,
          newVote.innovationRating,
          newVote.presentationRating,
          newVote.viabilityRating,
          newVote.overallRating,
          newVote.tags,
          newVote.feedback,
          newVote.visitorSessionId,
          newVote.createdAt,
        ]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        return {
          id: row.id,
          teamId: row.team_id,
          stall: row.stall,
          innovationRating: Number(row.innovation_rating),
          presentationRating: Number(row.presentation_rating),
          viabilityRating: Number(row.viability_rating),
          overallRating: Number(row.overall_rating),
          tags: row.tags || [],
          feedback: row.feedback || '',
          visitorSessionId: row.visitor_session_id,
          createdAt: row.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase PostgreSQL submitVote failed, falling back:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('votes')
        .insert({
          id: newVote.id,
          team_id: newVote.teamId,
          stall: newVote.stall,
          innovation_rating: newVote.innovationRating,
          presentation_rating: newVote.presentationRating,
          viability_rating: newVote.viabilityRating,
          overall_rating: newVote.overallRating,
          tags: newVote.tags,
          feedback: newVote.feedback,
          visitor_session_id: newVote.visitorSessionId,
          created_at: newVote.createdAt,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          teamId: data.team_id,
          stall: data.stall,
          innovationRating: Number(data.innovation_rating),
          presentationRating: Number(data.presentation_rating),
          viabilityRating: Number(data.viability_rating),
          overallRating: Number(data.overall_rating),
          tags: data.tags || [],
          feedback: data.feedback || '',
          visitorSessionId: data.visitor_session_id,
          createdAt: data.created_at,
        };
      }
    } catch (err) {
      console.warn('Supabase submitVote failed, saving locally:', err);
    }
  }

  const local = getLocalDb();
  local.votes.push(newVote);
  saveLocalDb(local);
  return newVote;
}

export async function getVotes(teamId?: string): Promise<Vote[]> {
  const pool = getPostgresPool();
  if (pool) {
    try {
      const query = teamId
        ? 'SELECT * FROM votes WHERE team_id = $1 ORDER BY created_at DESC;'
        : 'SELECT * FROM votes ORDER BY created_at DESC;';
      const params = teamId ? [teamId] : [];
      const res = await pool.query(query, params);
      return res.rows.map((row) => ({
        id: row.id,
        teamId: row.team_id,
        stall: row.stall,
        innovationRating: Number(row.innovation_rating),
        presentationRating: Number(row.presentation_rating),
        viabilityRating: Number(row.viability_rating),
        overallRating: Number(row.overall_rating),
        tags: row.tags || [],
        feedback: row.feedback || '',
        visitorSessionId: row.visitor_session_id,
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('Supabase PostgreSQL getVotes failed, falling back:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('votes').select('*').order('created_at', { ascending: false });
      if (teamId) {
        query = query.eq('team_id', teamId);
      }
      const { data, error } = await query;
      if (!error && data) {
        return data.map((v) => ({
          id: v.id,
          teamId: v.team_id,
          stall: v.stall,
          innovationRating: Number(v.innovation_rating),
          presentationRating: Number(v.presentation_rating),
          viabilityRating: Number(v.viability_rating),
          overallRating: Number(v.overall_rating),
          tags: v.tags || [],
          feedback: v.feedback || '',
          visitorSessionId: v.visitor_session_id,
          createdAt: v.created_at,
        }));
      }
    } catch (err) {
      console.warn('Supabase getVotes failed, reading locally:', err);
    }
  }

  const local = getLocalDb();
  if (teamId) {
    return local.votes
      .filter((v) => v.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return [...local.votes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const teams = await getTeams();
  const votes = await getVotes();

  return teams.map((team) => {
    const teamVotes = votes.filter((v) => v.teamId === team.id);
    const count = teamVotes.length;

    let avgOverall = 0;
    let avgInnovation = 0;
    let avgPresentation = 0;
    let avgViability = 0;

    if (count > 0) {
      const sumOverall = teamVotes.reduce((acc, v) => acc + v.overallRating, 0);
      const sumInno = teamVotes.reduce((acc, v) => acc + v.innovationRating, 0);
      const sumPres = teamVotes.reduce((acc, v) => acc + v.presentationRating, 0);
      const sumViab = teamVotes.reduce((acc, v) => acc + v.viabilityRating, 0);

      avgOverall = Number((sumOverall / count).toFixed(2));
      avgInnovation = Number((sumInno / count).toFixed(2));
      avgPresentation = Number((sumPres / count).toFixed(2));
      avgViability = Number((sumViab / count).toFixed(2));
    }

    const recentFeedback = teamVotes
      .filter((v) => Boolean(v.feedback && v.feedback.trim().length > 0))
      .slice(0, 10)
      .map((v) => ({
        feedback: v.feedback || '',
        rating: v.overallRating,
        createdAt: v.createdAt,
        tags: v.tags,
      }));

    return {
      teamId: team.id,
      teamName: team.name,
      pitchTitle: team.pitchTitle,
      stall: team.stall,
      category: team.category,
      totalVotes: count,
      avgOverall,
      avgInnovation,
      avgPresentation,
      avgViability,
      recentFeedback,
    };
  }).sort((a, b) => {
    // Sort primarily by highest avg overall score, secondary by total votes count
    if (b.avgOverall !== a.avgOverall) {
      return b.avgOverall - a.avgOverall;
    }
    return b.totalVotes - a.totalVotes;
  });
}

export async function clearAllVotes(): Promise<boolean> {
  const pool = getPostgresPool();
  if (pool) {
    try {
      await pool.query('DELETE FROM votes;');
      return true;
    } catch (err) {
      console.warn('Supabase PostgreSQL clearAllVotes failed, falling back:', err);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('votes').delete().neq('id', 'placeholder');
      if (!error) {
        const local = getLocalDb();
        local.votes = [];
        saveLocalDb(local);
        return true;
      }
    } catch (err) {
      console.warn('Supabase clearAllVotes failed, clearing locally:', err);
    }
  }

  const local = getLocalDb();
  local.votes = [];
  saveLocalDb(local);
  return true;
}

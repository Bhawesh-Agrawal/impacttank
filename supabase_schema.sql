-- =========================================================
-- PitchArena - Supabase Database Schema
-- Run this script in your Supabase SQL Editor to initialize.
-- =========================================================

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pitch_title TEXT NOT NULL,
  description TEXT NOT NULL,
  stall TEXT NOT NULL,
  category TEXT NOT NULL,
  members TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  stall TEXT NOT NULL,
  innovation_rating NUMERIC(3, 2) NOT NULL,
  presentation_rating NUMERIC(3, 2) NOT NULL,
  viability_rating NUMERIC(3, 2) NOT NULL,
  overall_rating NUMERIC(3, 2) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  feedback TEXT DEFAULT '',
  visitor_session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for fast aggregation & leaderboards
CREATE INDEX IF NOT EXISTS idx_votes_team_id ON public.votes(team_id);
CREATE INDEX IF NOT EXISTS idx_votes_stall ON public.votes(stall);
CREATE INDEX IF NOT EXISTS idx_teams_stall ON public.teams(stall);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 5. Public RLS Policies
-- Allow anyone to read active teams
CREATE POLICY "Allow public read teams" ON public.teams
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow public insert votes (anonymous voting)
CREATE POLICY "Allow public insert votes" ON public.votes
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow public read votes for leaderboard stats
CREATE POLICY "Allow public read votes" ON public.votes
  FOR SELECT TO anon, authenticated
  USING (true);

-- 6. Insert Initial Demo Teams (if empty)
INSERT INTO public.teams (id, name, pitch_title, description, stall, category, members, active)
VALUES
  ('team-1', 'NeuralFlow AI', 'Edge AI Diagnostics for Emergency First Responders', 'Ultra-fast multimodal AI triage assistant running entirely offline on handheld devices to assist paramedic triage in disaster zones.', 'Stall 1', 'Healthcare & AI', 'Dr. Sarah Chen, Liam Vance', true),
  ('team-2', 'VerdeGrid', 'Decentralized Peer-to-Peer Solar Microgrid Trading', 'Smart neighborhood energy router allowing rooftop solar owners to sell excess battery power directly to nearby households with zero intermediaries.', 'Stall 1', 'CleanTech & Energy', 'Amara Patel, Kenji Sato', true),
  ('team-3', 'PulsePay', 'Zero-Fee Instant Cross-Border Micro-Remittances', 'Next-gen settlement network connecting local mobile money accounts worldwide with sub-second finality and guaranteed FX rates.', 'Stall 2', 'Fintech', 'Elena Rostova, Carlos Mendez', true),
  ('team-4', 'AeroCrop Autonomous', 'Autonomous Swarm Drones for Targeted Crop Health', 'Autonomous miniature quadcopters that scan hectare-scale farmland with multispectral sensors and spot-treat pests, reducing pesticide usage by 85%.', 'Stall 2', 'AgriTech & Robotics', 'Rajiv Sharma, Chloe Dupuis', true),
  ('team-5', 'CognitivePlay', 'Spatial AR Math & Physics Playground for Neurodivergent Learners', 'An interactive tactile projection and AR system turning abstract STEM formulas into tangible, playful 3D experiments for ADHD & autistic students.', 'Stall 3', 'EdTech & XR', 'Maya Lin, Jordan Lee', true),
  ('team-6', 'CipherShield', 'Post-Quantum Cryptographic Key Exchange for Industrial IoT', 'Ultra-lightweight quantum-resilient lattice encryption firmware designed to run seamlessly on low-power microcontrollers in smart grids.', 'Stall 3', 'Cybersecurity', 'Marcus Webb, Anya Becker', true)
ON CONFLICT (id) DO NOTHING;

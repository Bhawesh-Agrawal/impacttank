export interface Team {
  id: string;
  name: string;
  pitchTitle: string;
  description: string;
  stall: string;
  category: string;
  members?: string;
  active: boolean;
  createdAt: string;
}

export interface Vote {
  id: string;
  teamId: string;
  stall: string;
  innovationRating: number; // 1-5
  presentationRating: number; // 1-5
  viabilityRating: number; // 1-5
  overallRating: number; // 1-5 (calculated or direct)
  tags?: string[];
  feedback?: string;
  visitorSessionId: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  pitchTitle: string;
  stall: string;
  category: string;
  totalVotes: number;
  avgOverall: number;
  avgInnovation: number;
  avgPresentation: number;
  avgViability: number;
  recentFeedback: {
    feedback: string;
    rating: number;
    createdAt: string;
    tags?: string[];
  }[];
}

export interface DatabaseStatus {
  provider: 'supabase' | 'local';
  connected: boolean;
  message: string;
}

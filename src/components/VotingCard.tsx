'use client';

import React from 'react';
import { Sparkles, Users } from 'lucide-react';
import StarRating from './StarRating';
import { Team } from '@/lib/types';

interface VotingCardProps {
  team: Team;
  rating: number;
  onRatingChange: (val: number) => void;
  disabled?: boolean;
}

export default function VotingCard({
  team,
  rating,
  onRatingChange,
  disabled = false,
}: VotingCardProps) {
  const isRated = rating > 0;

  return (
    <div className={`pitch-card ${isRated ? 'voted' : ''}`}>
      {/* Top badges */}
      <div className="card-top-bar">
        <span className="badge-stall">{team.stall}</span>
        <span className="badge-category">{team.category}</span>
      </div>

      {/* Team Details */}
      <h3 className="card-team-name">{team.name}</h3>
      <h4 className="card-pitch-title">{team.pitchTitle}</h4>
      <p className="card-pitch-desc">{team.description}</p>

      {team.members && (
        <div className="card-members">
          <Users size={14} />
          <span>Pitchers: {team.members}</span>
        </div>
      )}

      {/* Rating Row - Clean with no individual button */}
      <div className="rating-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Sparkles size={16} style={{ color: '#F59E0B' }} />
            Rate Pitch
          </span>
          <div className="criteria-score-badge">
            {isRated ? `${rating}.0 / 5.0` : '0 / 5.0'}
          </div>
        </div>

        <div className="criteria-row">
          <div className="criteria-label-row">
            <span>Rating</span>
            <span className="criteria-score-badge">
              {isRated ? `${rating} ★` : 'Tap stars to rate'}
            </span>
          </div>
          <StarRating
            value={rating}
            onChange={onRatingChange}
            size={28}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

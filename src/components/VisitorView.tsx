'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Send, Sparkles, UserCheck } from 'lucide-react';
import Header from './Header';
import VotingCard from './VotingCard';
import AdminLogin from './AdminLogin';
import { Team } from '@/lib/types';

export default function VisitorView() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [guestSessionId, setGuestSessionId] = useState<string>('');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<{
    count: number;
    show: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper to generate a new unique anonymous session ID
  const generateNewSessionId = () => {
    const sid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pitch_guest_session_id', sid);
    }
    return sid;
  };

  // Initialize fresh anonymous visitor session ID
  useEffect(() => {
    let sid = localStorage.getItem('pitch_guest_session_id');
    if (!sid) {
      sid = generateNewSessionId();
    }
    setGuestSessionId(sid);
  }, []);

  // Check visitor authentication
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      const authed = Boolean(data.authenticated);
      setIsAuthenticated(authed);
      if (authed) {
        fetchTeams();
      } else {
        setLoading(false);
      }
    } catch {
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch teams from API and initialize all ratings to 0
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/teams?active=true');
      const data = await res.json();
      if (res.ok && data.teams) {
        setTeams(data.teams);

        // Always initialize clean with 0 for all teams
        const cleanRatings: Record<string, number> = {};
        data.teams.forEach((t: Team) => {
          cleanRatings[t.id] = 0;
        });
        setRatings(cleanRatings);
      }
    } catch (err) {
      console.error('Failed to load teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleRatingChange = (teamId: string, val: number) => {
    setRatings((prev) => ({
      ...prev,
      [teamId]: val,
    }));
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Count how many teams currently have a rating > 0
  const ratedCount = Object.values(ratings).filter((r) => r > 0).length;

  const handleSubmitAll = async () => {
    if (ratedCount === 0) {
      setErrorMessage('Please tap the stars to rate at least one team pitch before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Build batch payload of all rated teams
      const votesPayload = teams
        .filter((t) => (ratings[t.id] || 0) > 0)
        .map((t) => ({
          teamId: t.id,
          stall: t.stall,
          rating: ratings[t.id],
          overallRating: ratings[t.id],
        }));

      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          votes: votesPayload,
          visitorSessionId: guestSessionId,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        setIsAuthenticated(false);
        throw new Error('Your session has expired. Please sign in again with your credentials.');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit ratings');
      }

      // Celebratory Confetti!
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#4F46E5', '#7C3AED', '#F59E0B', '#10B981'],
      });

      // Clear any stored vote caches in localStorage
      teams.forEach((t) => {
        localStorage.removeItem(`pitch_vote_${t.id}`);
      });

      // Reset all ratings to 0 for the next guest
      const cleanRatings: Record<string, number> = {};
      teams.forEach((t) => {
        cleanRatings[t.id] = 0;
      });
      setRatings(cleanRatings);

      // Issue a brand new session ID for the next guest
      const newSid = generateNewSessionId();
      setGuestSessionId(newSid);

      // Show temporary celebration & ready-for-next-guest banner
      setSuccessBanner({ count: votesPayload.length, show: true });

      // Scroll smoothly to top for the next guest
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Auto-hide banner after 7 seconds
      setTimeout(() => {
        setSuccessBanner((prev) => (prev ? { ...prev, show: false } : null));
      }, 7000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting ratings';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Initial authentication loading state
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748B',
          background: '#F8FAFC',
        }}
      >
        Verifying access credentials...
      </div>
    );
  }

  // 2. Unauthenticated state: Require credentials to view and vote
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header isAuthenticated={false} />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AdminLogin
            title="Impact Tank"
            subtitle="Please sign in with credentials to access team pitches and vote."
            submitButtonText="Sign In to Vote"
            showBackLink={false}
            onLoginSuccess={() => {
              setIsAuthenticated(true);
              fetchTeams();
            }}
          />
        </main>
      </div>
    );
  }

  // 3. Authenticated state: View pitches and cast votes
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header isAuthenticated={true} onLogout={handleLogout} />

      {/* Floating Success Notice when a guest finishes voting */}
      {successBanner && successBanner.show && (
        <div
          style={{
            position: 'fixed',
            top: '4.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: '#ECFDF5',
            border: '1px solid #10B981',
            boxShadow: '0 12px 32px rgba(16, 185, 129, 0.2)',
            borderRadius: '9999px',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#065F46',
            fontWeight: 600,
            fontSize: '0.925rem',
            maxWidth: '92vw',
            animation: 'slide-up 0.3s ease',
          }}
        >
          <UserCheck size={20} style={{ color: '#059669', flexShrink: 0 }} />
          <span>
            Ratings recorded! Thank you. Form reset for the next guest.
          </span>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#059669',
              cursor: 'pointer',
              marginLeft: '0.5rem',
              fontSize: '1.1rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      <main style={{ flex: 1 }}>
        {/* Clean Hero Section */}
        <section className="hero-section">
          <h1 className="hero-title">
            Discover Great Ideas. <br />
            <span className="gradient-text">Rate Every Pitch.</span>
          </h1>

          <p className="hero-subtitle">
            Welcome to Impact Tank. Listen to the teams pitch their solutions, select your star ratings, and submit all ratings below.
          </p>
        </section>

        {/* Teams Voting Grid */}
        <section className="teams-grid">
          {loading ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '4rem 1rem',
                color: 'var(--text-muted)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  width: '32px',
                  height: '32px',
                  border: '3px solid #E2E8F0',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '1rem',
                }}
              />
              <div>Loading pitching teams...</div>
            </div>
          ) : teams.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>No teams found</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                There are currently no active pitching teams registered.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={fetchTeams}
              >
                Refresh Teams
              </button>
            </div>
          ) : (
            teams.map((team) => (
              <VotingCard
                key={team.id}
                team={team}
                rating={ratings[team.id] || 0}
                onRatingChange={(val) => handleRatingChange(team.id, val)}
              />
            ))
          )}
        </section>

        {/* Single Bottom Submit Section for All Teams */}
        {!loading && teams.length > 0 && (
          <section className="submit-bar-container">
            <div className="submit-bar-card">
              <div className="submit-bar-info">
                <div className="submit-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: '#F59E0B' }} />
                  <span>Submit All Ratings</span>
                </div>
                <div className="submit-bar-subtitle">
                  {ratedCount > 0 ? (
                    <span><strong>{ratedCount}</strong> of {teams.length} teams rated</span>
                  ) : (
                    <span>Tap the stars on each team above to rate</span>
                  )}
                </div>
                {errorMessage && (
                  <div style={{ color: '#E11D48', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 500 }}>
                    {errorMessage}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.85rem 2.25rem', fontSize: '1rem' }}
                disabled={isSubmitting || ratedCount === 0}
                onClick={handleSubmitAll}
              >
                <Send size={16} />
                <span>
                  {isSubmitting
                    ? 'Submitting...'
                    : ratedCount === 0
                    ? 'Select Ratings Above'
                    : `Submit All Ratings (${ratedCount})`}
                </span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.825rem',
          color: 'var(--text-muted)',
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <strong>Impact Tank Event Platform</strong> • Anonymous Guest Feedback & Voting
          </div>
          <div>
            <a href="/admin" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>
              Organizer Admin Access →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

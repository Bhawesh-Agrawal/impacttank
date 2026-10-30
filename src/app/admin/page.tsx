'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  CheckCircle,
  Download,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  QrCode,
  MapPin,
  Flame,
  Star,
  ExternalLink,
  Edit,
  Database,
  HelpCircle,
} from 'lucide-react';
import AdminLogin from '@/components/AdminLogin';
import TeamModal from '@/components/TeamModal';
import QRCodeModal from '@/components/QRCodeModal';
import { Team, LeaderboardEntry, Vote, DatabaseStatus } from '@/lib/types';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Dashboard Data State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [totalVotes, setTotalVotes] = useState<number>(0);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // UI state
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed' | 'teams' | 'stalls' | 'settings'>('leaderboard');
  const [teamModalOpen, setTeamModalOpen] = useState<boolean>(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Check auth session
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/status');
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch full dashboard data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [votesRes, teamsRes, statusRes] = await Promise.all([
        fetch('/api/votes?includeVotes=true'),
        fetch('/api/teams'),
        fetch('/api/status'),
      ]);

      const votesData = await votesRes.json();
      const teamsData = await teamsRes.json();
      const statusData = await statusRes.json();

      if (votesData.leaderboard) setLeaderboard(votesData.leaderboard);
      if (votesData.votes) setVotes(votesData.votes);
      if (votesData.totalVotes !== undefined) setTotalVotes(votesData.totalVotes);
      if (teamsData.teams) setTeams(teamsData.teams);
      if (statusData) setDbStatus(statusData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast('Error refreshing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      // Auto refresh every 15 seconds during live event
      const interval = setInterval(fetchData, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchData]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Handle Delete Team
  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}"? All associated ratings will be removed.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Team "${name}" deleted`);
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete team');
      }
    } catch {
      showToast('Error deleting team');
    }
  };

  // Handle Reset All Votes
  const handleResetVotes = async () => {
    const confirmation = prompt(
      'Type "RESET" to confirm clearing all votes and ratings for the live event:'
    );
    if (confirmation !== 'RESET') {
      return;
    }

    try {
      setIsClearing(true);
      const res = await fetch('/api/votes/reset', { method: 'POST' });
      if (res.ok) {
        showToast('All votes reset successfully. Ready for live event!');
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to reset votes');
      }
    } catch {
      showToast('Error resetting votes');
    } finally {
      setIsClearing(false);
    }
  };

  // Export Leaderboard & Votes to CSV
  const handleExportCSV = () => {
    if (leaderboard.length === 0) {
      showToast('No data to export');
      return;
    }

    let csv = 'Rank,Team Name,Stall,Category,Pitch Title,Overall Score,Innovation Score,Presentation Score,Viability Score,Total Votes\n';
    leaderboard.forEach((entry, idx) => {
      const row = [
        idx + 1,
        `"${entry.teamName.replace(/"/g, '""')}"`,
        `"${entry.stall}"`,
        `"${entry.category}"`,
        `"${entry.pitchTitle.replace(/"/g, '""')}"`,
        entry.avgOverall.toFixed(2),
        entry.avgInnovation.toFixed(2),
        entry.avgPresentation.toFixed(2),
        entry.avgViability.toFixed(2),
        entry.totalVotes,
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `impact-tank-results-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Exported successfully');
  };

  // Computed KPIs
  const kpis = useMemo(() => {
    const totalVotesCount = totalVotes;
    const activeTeamsCount = teams.filter((t) => t.active).length;
    const uniqueStallsCount = new Set(teams.map((t) => t.stall)).size;

    let overallAvg = 0;
    if (leaderboard.length > 0) {
      const votedTeams = leaderboard.filter((l) => l.totalVotes > 0);
      if (votedTeams.length > 0) {
        const sum = votedTeams.reduce((acc, curr) => acc + curr.avgOverall, 0);
        overallAvg = Number((sum / votedTeams.length).toFixed(2));
      }
    }

    const topTeam = leaderboard.length > 0 && leaderboard[0].totalVotes > 0 ? leaderboard[0] : null;

    return {
      totalVotesCount,
      activeTeamsCount,
      uniqueStallsCount,
      overallAvg,
      topTeam,
    };
  }, [totalVotes, teams, leaderboard]);

  // Unique stalls
  const stallNames = useMemo(() => {
    return Array.from(new Set(teams.map((t) => t.stall))).sort();
  }, [teams]);

  // Stalls analytics breakdown
  const stallStats = useMemo(() => {
    return stallNames.map((stall) => {
      const stallTeams = teams.filter((t) => t.stall === stall);
      const stallTeamIds = new Set(stallTeams.map((t) => t.id));
      const stallVotes = votes.filter((v) => stallTeamIds.has(v.teamId) || v.stall === stall);
      
      let avgScore = 0;
      if (stallVotes.length > 0) {
        const sum = stallVotes.reduce((acc, v) => acc + v.overallRating, 0);
        avgScore = Number((sum / stallVotes.length).toFixed(2));
      }

      return {
        stall,
        teamsCount: stallTeams.length,
        votesCount: stallVotes.length,
        avgScore,
      };
    });
  }, [stallNames, teams, votes]);

  // Loading state for initial auth check
  if (isAuthenticated === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
        Checking organizer credentials...
      </div>
    );
  }

  // If not authenticated, render Login Form
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          fetchData();
        }}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Admin Top Navigation */}
      <header className="app-header">
        <div className="header-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/" className="brand-badge">
              <div>
                <div className="brand-name" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  <span>Impact Tank</span>
                  <span style={{ fontSize: '0.75rem', color: '#4F46E5', fontWeight: 600, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '0.15rem 0.5rem', borderRadius: '4px', marginLeft: '8px' }}>
                    ADMIN
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Organizer Command Center
                </div>
              </div>
            </Link>

            {/* DB status pill */}
            {dbStatus && (
              <div
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px',
                  background: dbStatus.provider === 'supabase' && dbStatus.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: dbStatus.provider === 'supabase' && dbStatus.connected ? '#6EE7B7' : '#C7D2FE',
                  border: `1px solid ${dbStatus.provider === 'supabase' && dbStatus.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(99, 102, 241, 0.3)'}`,
                }}
                className="desktop-db-pill"
              >
                <Database size={12} />
                <span>{dbStatus.provider === 'supabase' ? 'Supabase Cloud' : 'Local Storage Mode'}</span>
              </div>
            )}
          </div>

          <div className="nav-actions">
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              onClick={fetchData}
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setQrModalOpen(true)}
            >
              <QrCode size={14} />
              <span>Stall QR Codes</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem' }}
              onClick={handleExportCSV}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', color: '#FDA4AF' }}
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="admin-container" style={{ flex: 1 }}>
        {/* KPI Summary Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818CF8' }}>
              <Flame size={24} />
            </div>
            <div>
              <div className="kpi-value">{kpis.totalVotesCount}</div>
              <div className="kpi-label">Total Votes Cast</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
              <Star size={24} />
            </div>
            <div>
              <div className="kpi-value">{kpis.overallAvg > 0 ? kpis.overallAvg.toFixed(1) : '--'}</div>
              <div className="kpi-label">Average Event Rating</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <Users size={24} />
            </div>
            <div>
              <div className="kpi-value">{kpis.activeTeamsCount} Teams</div>
              <div className="kpi-label">{kpis.uniqueStallsCount} Simultaneous Stalls</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' }}>
              <Trophy size={24} />
            </div>
            <div>
              <div className="kpi-value" style={{ fontSize: '1.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                {kpis.topTeam ? kpis.topTeam.teamName : 'Awaiting Votes'}
              </div>
              <div className="kpi-label">
                {kpis.topTeam ? `#1 Rank (${kpis.topTeam.avgOverall.toFixed(1)} ★)` : 'Leaderboard Peak'}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy size={16} />
            <span>Leaderboard & Podium</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            <Flame size={16} />
            <span>Live Votes Stream ({votes.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'stalls' ? 'active' : ''}`}
            onClick={() => setActiveTab('stalls')}
          >
            <MapPin size={16} />
            <span>Stall Breakdown</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <Users size={16} />
            <span>Manage Teams ({teams.length})</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Database size={16} />
            <span>Database & Cloud Controls</span>
          </button>
        </div>

        {/* TAB 1: LEADERBOARD & PODIUM */}
        {activeTab === 'leaderboard' && (
          <div>
            {/* Top 3 Podium Cards */}
            {leaderboard.length >= 3 && leaderboard.some((l) => l.totalVotes > 0) && (
              <div className="podium-container">
                {/* 2nd Place */}
                <div className="podium-card rank-2">
                  <div className="podium-badge silver">2</div>
                  <span className="badge-stall" style={{ marginBottom: '0.5rem' }}>{leaderboard[1].stall}</span>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{leaderboard[1].teamName}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    {leaderboard[1].pitchTitle}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                    {leaderboard[1].avgOverall.toFixed(1)} <span style={{ fontSize: '1rem', color: '#F59E0B' }}>★</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {leaderboard[1].totalVotes} votes cast
                  </div>
                </div>

                {/* 1st Place */}
                <div className="podium-card rank-1">
                  <div className="podium-badge gold">1</div>
                  <span className="badge-stall" style={{ marginBottom: '0.5rem', background: 'rgba(245, 158, 11, 0.2)', borderColor: '#F59E0B', color: '#FDE68A' }}>
                    {leaderboard[0].stall}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.25rem', color: '#FFFFFF' }}>{leaderboard[0].teamName}</h3>
                  <div style={{ fontSize: '0.85rem', color: '#C7D2FE', marginBottom: '0.75rem' }}>
                    {leaderboard[0].pitchTitle}
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F59E0B', marginBottom: '0.25rem' }}>
                    {leaderboard[0].avgOverall.toFixed(1)} <span style={{ fontSize: '1.25rem' }}>★</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#E2E8F0', fontWeight: 600 }}>
                    {leaderboard[0].totalVotes} votes cast
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="podium-card rank-3">
                  <div className="podium-badge bronze">3</div>
                  <span className="badge-stall" style={{ marginBottom: '0.5rem' }}>{leaderboard[2].stall}</span>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>{leaderboard[2].teamName}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                    {leaderboard[2].pitchTitle}
                  </div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                    {leaderboard[2].avgOverall.toFixed(1)} <span style={{ fontSize: '1rem', color: '#F59E0B' }}>★</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {leaderboard[2].totalVotes} votes cast
                  </div>
                </div>
              </div>
            )}

            {/* Standings Table */}
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team & Pitch</th>
                    <th>Stall</th>
                    <th>Innovation</th>
                    <th>Presentation</th>
                    <th>Viability</th>
                    <th>Total Votes</th>
                    <th>Overall Score</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No teams recorded yet.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((item, idx) => (
                      <tr key={item.teamId}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              background:
                                idx === 0
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : idx === 1
                                  ? 'rgba(148, 163, 184, 0.2)'
                                  : idx === 2
                                  ? 'rgba(217, 119, 6, 0.2)'
                                  : 'rgba(255, 255, 255, 0.05)',
                              color:
                                idx === 0
                                  ? '#F59E0B'
                                  : idx === 1
                                  ? '#CBD5E1'
                                  : idx === 2
                                  ? '#F97316'
                                  : 'var(--text-dim)',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '1rem' }}>
                            {item.teamName}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {item.pitchTitle}
                          </div>
                          <span className="badge-category" style={{ marginTop: '0.35rem' }}>
                            {item.category}
                          </span>
                        </td>
                        <td>
                          <span className="badge-stall">{item.stall}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {item.avgInnovation > 0 ? `${item.avgInnovation.toFixed(1)} ★` : '--'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {item.avgPresentation > 0 ? `${item.avgPresentation.toFixed(1)} ★` : '--'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {item.avgViability > 0 ? `${item.avgViability.toFixed(1)} ★` : '--'}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {item.totalVotes}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: item.avgOverall >= 4 ? '#10B981' : item.avgOverall >= 3 ? '#F59E0B' : '#FFFFFF' }}>
                              {item.avgOverall > 0 ? item.avgOverall.toFixed(1) : '0.0'}
                            </span>
                            <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${(item.avgOverall / 5) * 100}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #6366F1, #F59E0B)',
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE VOTES STREAM */}
        {activeTab === 'feed' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Real-Time Feedback Feed</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Anonymous guest votes and remarks as they are submitted from stalls.
                </p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={fetchData}>
                <RefreshCw size={14} />
                Refresh Feed
              </button>
            </div>

            {votes.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No votes recorded yet. Invite visitors to start pitching and rating!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {votes.map((v) => {
                  const team = teams.find((t) => t.id === v.teamId);
                  const timeFormatted = new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={v.id}
                      className="glass-panel"
                      style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span className="badge-stall">{v.stall}</span>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF' }}>
                            {team ? team.name : 'Unknown Team'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            {timeFormatted}
                          </span>
                          <span
                            style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: '#F59E0B',
                              background: 'rgba(245, 158, 11, 0.15)',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                            }}
                          >
                            {v.overallRating.toFixed(1)} ★
                          </span>
                        </div>
                      </div>

                      {/* Score breakdown chips */}
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        <span>Innovation: <strong>{v.innovationRating}★</strong></span>
                        <span>Presentation: <strong>{v.presentationRating}★</strong></span>
                        <span>Viability: <strong>{v.viabilityRating}★</strong></span>
                      </div>

                      {/* Tags */}
                      {v.tags && v.tags.length > 0 && (
                        <div className="tag-pills-row">
                          {v.tags.map((tag) => (
                            <span key={tag} className="tag-pill selected" style={{ cursor: 'default' }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Guest feedback */}
                      {v.feedback && (
                        <div
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            borderLeft: '3px solid #6366F1',
                            fontSize: '0.875rem',
                            color: '#E2E8F0',
                            fontStyle: 'italic',
                          }}
                        >
                          &ldquo;{v.feedback}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: STALLS BREAKDOWN */}
        {activeTab === 'stalls' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Stall Turnout & Performance</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Compare traffic and ratings across the physical stalls operating simultaneously.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {stallStats.map((s) => (
                <div key={s.stall} className="glass-panel" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span className="badge-stall" style={{ fontSize: '0.85rem' }}>{s.stall}</span>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => setQrModalOpen(true)}
                    >
                      <QrCode size={13} />
                      QR
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '1rem 0' }}>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF' }}>{s.votesCount}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Votes Cast</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F59E0B' }}>
                        {s.avgScore > 0 ? s.avgScore.toFixed(1) : '--'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Rating</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', fontSize: '0.825rem', color: 'var(--text-dim)' }}>
                    Teams pitching here: <strong>{s.teamsCount}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TEAM ROSTER MANAGEMENT */}
        {activeTab === 'teams' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Pitching Teams Roster</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Add, edit, or adjust teams participating in tomorrow's event.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setEditingTeam(null);
                  setTeamModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Add Pitch Team</span>
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Team Name</th>
                    <th>Pitch Title</th>
                    <th>Stall</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team) => (
                    <tr key={team.id}>
                      <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{team.name}</td>
                      <td>
                        <div style={{ color: '#C7D2FE', fontSize: '0.9rem' }}>{team.pitchTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{team.members || 'No members listed'}</div>
                      </td>
                      <td>
                        <span className="badge-stall">{team.stall}</span>
                      </td>
                      <td>
                        <span className="badge-category">{team.category}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: team.active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                            color: team.active ? '#10B981' : 'var(--text-muted)',
                            fontWeight: 700,
                          }}
                        >
                          {team.active ? 'ACTIVE' : 'HIDDEN'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => {
                              setEditingTeam(team);
                              setTeamModalOpen(true);
                            }}
                            title="Edit Team"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                            title="Delete Team"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DATABASE & CLOUD SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Database Status Card */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Database size={24} style={{ color: '#8B5CF6' }} />
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Online Cloud Database Setup</h3>
              </div>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '1.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <strong style={{ color: '#FFFFFF' }}>Current Storage Engine:</strong>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: dbStatus?.provider === 'supabase' && dbStatus?.connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                      color: dbStatus?.provider === 'supabase' && dbStatus?.connected ? '#6EE7B7' : '#A5B4FC',
                    }}
                  >
                    {dbStatus?.provider === 'supabase' ? 'SUPABASE CLOUD POSTGRES' : 'LOCAL PERSISTENT STORE'}
                  </span>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  {dbStatus?.message}
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#FFFFFF' }}>
                How to connect your Free Supabase Database in 60 seconds:
              </h4>

              <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-dim)', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <li>
                  Create a free project at <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: '#818CF8' }}>supabase.com</a>.
                </li>
                <li>
                  In your Supabase project dashboard, click <strong>SQL Editor</strong> in the left sidebar.
                </li>
                <li>
                  Copy and paste the schema provided in <code style={{ color: '#FDE68A' }}>supabase_schema.sql</code> (located in your project root) and click <strong>Run</strong>.
                </li>
                <li>
                  In Supabase Settings &gt; API, copy your <strong>Project URL</strong> and <strong>Anon Key</strong> (or Service Role Key).
                </li>
                <li>
                  Set these environment variables in your deployment (e.g. Vercel) or in <code style={{ color: '#FDE68A' }}>.env.local</code>:
                  <pre
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      marginTop: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#93C5FD',
                      overflowX: 'auto',
                    }}
                  >
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional for bypass)`}
                  </pre>
                </li>
              </ol>
            </div>

            {/* Event Reset & Safety Card */}
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Trash2 size={22} style={{ color: '#F43F5E' }} />
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#FDA4AF' }}>Reset Event Ratings</h3>
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Clears all cast votes and feedback while keeping your registered pitching teams and stalls intact. Use this right before guests arrive tomorrow to clear any test runs.
              </p>

              <button
                type="button"
                className="btn btn-danger"
                onClick={handleResetVotes}
                disabled={isClearing}
              >
                <Trash2 size={15} />
                {isClearing ? 'Clearing Votes...' : 'Clear All Test Votes (Reset for Tomorrow)'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Team Create/Edit Modal */}
      <TeamModal
        isOpen={teamModalOpen}
        initialTeam={editingTeam}
        onClose={() => {
          setTeamModalOpen(false);
          setEditingTeam(null);
        }}
        onSaved={(_team) => {
          showToast(editingTeam ? 'Team updated successfully' : 'New team added');
          fetchData();
        }}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        stalls={stallNames.length > 0 ? stallNames : ['Stall 1', 'Stall 2', 'Stall 3']}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast-notice">
          <CheckCircle size={18} style={{ color: '#10B981' }} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}

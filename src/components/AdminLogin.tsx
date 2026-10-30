'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  title?: string;
  subtitle?: string;
  submitButtonText?: string;
  showBackLink?: boolean;
}

export default function AdminLogin({
  onLoginSuccess,
  title = 'Organizer Access',
  subtitle = 'Enter credentials to access the organizer command center.',
  submitButtonText = 'Sign In to Dashboard',
  showBackLink = false,
}: AdminLoginProps) {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2.5rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
          }}
        >
          <Lock size={26} color="#FFFFFF" />
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '2rem', lineHeight: 1.5 }}>
          {subtitle}
        </p>

        {error && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              background: 'rgba(225, 29, 72, 0.08)',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              color: '#E11D48',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>{submitButtonText}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {showBackLink && (
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <a
              href="/"
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              ← Return to Main Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

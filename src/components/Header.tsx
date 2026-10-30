'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  currentStall?: string | null;
  onClearStallFilter?: () => void;
  isAdmin?: boolean;
  isAuthenticated?: boolean;
  onLogout?: () => void;
}

export default function Header({
  isAdmin = false,
  isAuthenticated = false,
  onLogout,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-container">
        <Link href="/" className="brand-badge">
          <div className="brand-name" style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Impact Tank
          </div>
        </Link>

        <div className="nav-actions">
          {isAdmin ? (
            <Link href="/" className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
              View Guest Portal
            </Link>
          ) : (
            <Link href="/admin" className="btn btn-secondary" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
              <ShieldCheck size={16} />
              <span>Organizer Admin</span>
            </Link>
          )}

          {isAuthenticated && onLogout && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: '#E11D48' }}
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

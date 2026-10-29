'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentStall?: string | null;
  onClearStallFilter?: () => void;
  isAdmin?: boolean;
}

export default function Header({
  isAdmin = false,
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
        </div>
      </div>
    </header>
  );
}

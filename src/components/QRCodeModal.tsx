'use client';

import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ExternalLink } from 'lucide-react';

interface QRCodeModalProps {
  stalls: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function QRCodeModal({ stalls, isOpen, onClose }: QRCodeModalProps) {
  const [selectedStall, setSelectedStall] = useState<string>(stalls[0] || 'Stall 1');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pitcharena.events';
  const stallUrl = `${origin}/?stall=${encodeURIComponent(selectedStall)}`;

  // Quick SVG QR Code visual generator using standard URL encoding API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    stallUrl
  )}&bgcolor=FFFFFF&color=4F46E5&margin=10`;

  const handleCopy = () => {
    navigator.clipboard.writeText(stallUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <QrCode size={20} style={{ color: '#8B5CF6' }} />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Stall QR Code & Booth Links</h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)', textAlign: 'left' }}>
          Display or print this QR code at each physical stall. When attendees scan it, the website opens filtered directly to that stall's pitching teams.
        </p>

        {/* Stall selector tabs inside modal */}
        <div className="stall-tabs-wrapper" style={{ justifyContent: 'center' }}>
          {stalls.map((s) => (
            <button
              key={s}
              type="button"
              className={`stall-tab-btn ${selectedStall === s ? 'active' : ''}`}
              onClick={() => setSelectedStall(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* QR Code Container */}
        <div
          style={{
            margin: '1.25rem auto',
            padding: '1.25rem',
            background: '#F8FAFC',
            borderRadius: '16px',
            border: '1px solid var(--border-subtle)',
            display: 'inline-block',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt={`QR Code for ${selectedStall}`}
            width={220}
            height={220}
            style={{ borderRadius: '8px', display: 'block' }}
          />
          <div style={{ marginTop: '0.75rem', fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
            {selectedStall} Voting Portal
          </div>
        </div>

        {/* Direct Link Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-input)',
            padding: '0.65rem 0.85rem',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            textAlign: 'left',
          }}
        >
          <input
            type="text"
            readOnly
            value={stallUrl}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              width: '100%',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <a
            href={stallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '0.85rem' }}
          >
            <ExternalLink size={14} />
            Test Link
          </a>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1, fontSize: '0.85rem' }}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

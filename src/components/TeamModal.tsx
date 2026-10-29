'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, PlusCircle, Edit } from 'lucide-react';
import { Team } from '@/lib/types';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (team: Team) => void;
  initialTeam?: Team | null;
}

export default function TeamModal({
  isOpen,
  onClose,
  onSaved,
  initialTeam,
}: TeamModalProps) {
  const [name, setName] = useState('');
  const [pitchTitle, setPitchTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stall, setStall] = useState('Stall 1');
  const [category, setCategory] = useState('AI & Technology');
  const [members, setMembers] = useState('');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTeam) {
      setName(initialTeam.name);
      setPitchTitle(initialTeam.pitchTitle);
      setDescription(initialTeam.description);
      setStall(initialTeam.stall);
      setCategory(initialTeam.category);
      setMembers(initialTeam.members || '');
      setActive(initialTeam.active);
    } else {
      setName('');
      setPitchTitle('');
      setDescription('');
      setStall('Stall 1');
      setCategory('AI & Technology');
      setMembers('');
      setActive(true);
    }
    setError(null);
  }, [initialTeam, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isEdit = Boolean(initialTeam?.id);
      const url = isEdit ? `/api/teams/${initialTeam!.id}` : '/api/teams';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name: name.trim(),
        pitchTitle: pitchTitle.trim(),
        description: description.trim(),
        stall: stall.trim(),
        category: category.trim(),
        members: members.trim(),
        active,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save team');
      }

      onSaved(data.team);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving team';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {initialTeam ? <Edit size={20} style={{ color: '#8B5CF6' }} /> : <PlusCircle size={20} style={{ color: '#10B981' }} />}
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
              {initialTeam ? 'Edit Pitch Team' : 'Add New Pitch Team'}
            </h3>
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

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(225, 29, 72, 0.08)', border: '1px solid rgba(225, 29, 72, 0.25)', borderRadius: '8px', color: '#E11D48', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Team Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Apex Dynamics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Stall *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Stall 1, Stall 2"
                value={stall}
                onChange={(e) => setStall(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Pitch / Project Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Real-Time Autonomous Wildfire Monitoring"
              value={pitchTitle}
              onChange={(e) => setPitchTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category / Domain</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CleanTech, Healthcare, AI"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Team Members</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Alice, Bob (Lead)"
                value={members}
                onChange={(e) => setMembers(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Idea / Pitch Summary *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Brief description of the problem, solution, and breakthrough..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="activeCheckbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366F1' }}
            />
            <label htmlFor="activeCheckbox" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
              Active (Visible on public guest voting frontier)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={15} />
              {loading ? 'Saving...' : initialTeam ? 'Save Changes' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Copy, Check, X, Share2, Globe, Sparkles } from 'lucide-react';
import { toast } from './Toast.jsx';

export default function ShareDialog({ isOpen, onClose, roomId }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/board/${roomId}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success('Whiteboard link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      toast.error('Failed to copy link.');
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: '#eef2ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Share2 size={18} />
            </div>
            <h3 className="modal-title">Share Whiteboard</h3>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close dialog">
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
          Invite collaborators to draw with you in real time. Anyone with this room link can join instantly.
        </p>

        {/* Room ID Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            ROOM ID
          </label>
          <div
            style={{
              padding: '0.5rem 0.75rem',
              background: 'var(--bg-main)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--primary)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>{roomId}</span>
            <span className="badge badge-indigo">Active Room</span>
          </div>
        </div>

        {/* Shareable Link Input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            SHAREABLE LINK
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="input"
              style={{ fontSize: '0.875rem', background: '#f8fafc' }}
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className={`btn ${copied ? 'btn-secondary' : 'btn-primary'}`}
              style={{ flexShrink: 0, minWidth: '100px' }}
            >
              {copied ? (
                <>
                  <Check size={16} style={{ color: '#10b981' }} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Collaboration Note */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem',
            fontSize: '0.8125rem',
            color: 'var(--text-muted)'
          }}
        >
          <Globe size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
          <span>
            <strong>Instant multi-user:</strong> Open this URL in another browser tab or on another computer on the same network to test live simultaneous drawing!
          </span>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

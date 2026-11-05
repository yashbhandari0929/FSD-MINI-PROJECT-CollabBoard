import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  CircleDot,
  Moon,
  Sun,
  User,
  LogIn,
  LogOut,
  FolderClock
} from 'lucide-react';
import CollaboratorList from './CollaboratorList.jsx';
import { toast } from './Toast.jsx';

export default function Navbar({
  roomId,
  boardTitle = 'Untitled Whiteboard',
  connectionStatus = 'connected',
  collaborators = [],
  currentUser,
  loggedInUser,
  isDarkMode = false,
  onToggleTheme,
  onOpenShare,
  onOpenAuth,
  onOpenSnapshots,
  onLogout
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyRoomId = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(roomId);
      }
      setCopied(true);
      toast.success(`Room ID ${roomId} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy room ID');
    }
  };

  const renderConnectionBadge = () => {
    switch (connectionStatus) {
      case 'connected':
      case 'cloud-live':
        return (
          <span className="badge badge-success" title="Real-time Collaborative Sync Active (Live Multi-User)">
            <span className="pulse-dot online" />
            <span>Live Sync</span>
          </span>
        );
      case 'connecting':
        return (
          <span className="badge badge-warning" title="Connecting to collaboration session...">
            <Loader2 size={12} className="animate-spin" />
            <span>Connecting</span>
          </span>
        );
      case 'standalone':
        return (
          <span
            className="badge badge-info"
            style={{ cursor: 'pointer', background: '#3b82f6', color: '#fff' }}
            title="Cloud Mode: Real-time Database & Snapshots synced to MongoDB Atlas. Click to configure a WebSocket server URL for multi-user sync."
            onClick={() => {
              const current = localStorage.getItem('collab_socket_url') || '';
              const newUrl = window.prompt(
                'Enter WebSocket Server URL for live multi-user sync (e.g. http://localhost:5005 or tunnel URL):',
                current
              );
              if (newUrl !== null) {
                if (newUrl.trim()) {
                  localStorage.setItem('collab_socket_url', newUrl.trim());
                } else {
                  localStorage.removeItem('collab_socket_url');
                }
                window.location.reload();
              }
            }}
          >
            <span className="pulse-dot online" style={{ background: '#93c5fd' }} />
            <span>Cloud (Atlas)</span>
          </span>
        );
      case 'error':
      case 'disconnected':
      default:
        return (
          <span
            className="badge badge-danger"
            style={{ cursor: 'pointer' }}
            title="WebSocket disconnected. Click to configure a server URL."
            onClick={() => {
              const current = localStorage.getItem('collab_socket_url') || '';
              const newUrl = window.prompt(
                'Enter WebSocket Server URL for live multi-user sync (e.g. http://localhost:5005 or tunnel URL):',
                current
              );
              if (newUrl !== null) {
                if (newUrl.trim()) {
                  localStorage.setItem('collab_socket_url', newUrl.trim());
                } else {
                  localStorage.removeItem('collab_socket_url');
                }
                window.location.reload();
              }
            }}
          >
            <span className="pulse-dot offline" />
            <span>Offline</span>
          </span>
        );
    }
  };

  return (
    <nav className="wb-navbar">
      {/* Left: Brand + Back + Room Info */}
      <div className="wb-nav-left">
        <Link to="/" className="btn-ghost" title="Back to Home" style={{ padding: '0.4rem' }}>
          <ArrowLeft size={18} />
        </Link>

        <div className="wb-logo-link">
          <div className="wb-logo-icon">
            <CircleDot size={18} />
          </div>
          <span style={{ letterSpacing: '-0.02em' }}>CollabBoard</span>
        </div>

        <div style={{ height: 20, width: 1, background: 'var(--border)' }} />

        {/* Room ID Pill with quick copy */}
        <button
          onClick={handleCopyRoomId}
          className="wb-room-pill"
          title="Click to copy Room ID"
        >
          <span>Room:</span>
          <span className="wb-room-id">{roomId}</span>
          {copied ? (
            <Check size={14} style={{ color: '#10b981' }} />
          ) : (
            <Copy size={14} style={{ color: 'var(--text-light)' }} />
          )}
        </button>

        {/* Real-time Connection Status */}
        {renderConnectionBadge()}
      </div>

      {/* Right: Collaborator Avatars + Theme Toggle + Auth + Share Button */}
      <div className="wb-nav-right">
        {/* Collaborators */}
        <CollaboratorList collaborators={collaborators} currentUser={currentUser} />

        <div style={{ height: 20, width: 1, background: 'var(--border)' }} />

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="btn-ghost"
          style={{ width: 34, height: 34, borderRadius: '8px', padding: 0 }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun size={18} style={{ color: '#f59e0b' }} />
          ) : (
            <Moon size={18} style={{ color: '#4f46e5' }} />
          )}
        </button>

        {/* Saved Snapshots Quick Access */}
        <button
          onClick={onOpenSnapshots}
          className="btn-ghost"
          style={{ width: 34, height: 34, borderRadius: '8px', padding: 0 }}
          title="My Saved Versions & Snapshots"
          aria-label="Open saved versions"
        >
          <FolderClock size={18} />
        </button>

        {/* User Account / Profile */}
        {loggedInUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.25rem 0.6rem',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600
              }}
              title={loggedInUser.email}
            >
              <User size={14} style={{ color: 'var(--primary)' }} />
              <span>{loggedInUser.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="btn-ghost"
              style={{ padding: '0.3rem', color: '#ef4444' }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={onOpenAuth} className="btn btn-secondary btn-sm" title="Sign in with email">
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}

        {/* Share Button */}
        <button onClick={onOpenShare} className="btn btn-primary btn-sm">
          <Share2 size={15} />
          <span>Share</span>
        </button>
      </div>
    </nav>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Sparkles,
  Users,
  Layers,
  ArrowRight,
  PlusCircle,
  LogIn,
  UserPlus,
  LogOut,
  Moon,
  Sun,
  FolderClock,
  Clock,
  Download,
  Trash2,
  Upload,
  ArrowUpRight,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Share2,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import {
  createBoardApi,
  fetchHealth,
  loginApi,
  registerApi,
  getMySnapshotsApi,
  deleteSnapshotApi
} from '../services/api.js';
import { toast } from '../components/Toast.jsx';

export default function HomePage() {
  const navigate = useNavigate();

  // Dark Mode Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('collab_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('collab_theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('collab_theme', 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // User State
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const stored = localStorage.getItem('collab_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Auth Form State (When not logged in)
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard Create & Join States
  const [boardTitle, setBoardTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Saved Snapshots State
  const [savedSnapshots, setSavedSnapshots] = useState([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  // Server health state
  const [serverHealth, setServerHealth] = useState(null);

  // Fetch server health on mount
  useEffect(() => {
    fetchHealth()
      .then((data) => setServerHealth(data))
      .catch((err) => console.warn('Server offline:', err.message));
  }, []);

  // Fetch user snapshots when logged in
  const loadUserSnapshots = (email) => {
    if (!email) return;
    setLoadingSnapshots(true);
    getMySnapshotsApi(email)
      .then((data) => {
        setSavedSnapshots(data.savedBoards || []);
      })
      .catch((err) => {
        console.warn('Could not load snapshots:', err.message);
      })
      .finally(() => setLoadingSnapshots(false));
  };

  useEffect(() => {
    if (loggedInUser?.email) {
      loadUserSnapshots(loggedInUser.email);
    }
  }, [loggedInUser]);

  // Auth Handlers
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      toast.warning('Please enter email and password.');
      return;
    }

    setAuthLoading(true);
    try {
      let data;
      if (authMode === 'register') {
        if (!authName.trim()) {
          toast.warning('Please enter your full name.');
          setAuthLoading(false);
          return;
        }
        data = await registerApi({ email: authEmail, name: authName, password: authPassword });
        toast.success(`Account registered! Welcome, ${data.user.name}`);
      } else {
        data = await loginApi({ email: authEmail, password: authPassword });
        toast.success(`Welcome back, ${data.user.name}!`);
      }

      localStorage.setItem('collab_user', JSON.stringify(data.user));
      localStorage.setItem('collab_username', data.user.name);
      localStorage.setItem('collab_user_email', data.user.email);
      setLoggedInUser(data.user);
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('collab_user');
    setLoggedInUser(null);
    setSavedSnapshots([]);
    toast.info('Signed out');
  };

  // Continue as Guest handler
  const handleGuestContinue = () => {
    const guestUser = {
      name: `Guest_${Math.floor(Math.random() * 900 + 100)}`,
      email: `guest_${Date.now()}@collabboard.local`
    };
    localStorage.setItem('collab_user', JSON.stringify(guestUser));
    localStorage.setItem('collab_username', guestUser.name);
    localStorage.setItem('collab_user_email', guestUser.email);
    setLoggedInUser(guestUser);
    toast.info(`Entered as ${guestUser.name}`);
  };

  // Create Whiteboard Handler
  const handleCreateBoard = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const data = await createBoardApi({
        title: boardTitle.trim() || 'Untitled Whiteboard',
        userName: loggedInUser?.name || 'Collaborator'
      });
      const targetRoomId = data.board.roomId;
      toast.success(`Launching Whiteboard (${targetRoomId})...`);
      navigate(`/board/${targetRoomId}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  // Join Existing Board Handler
  const handleJoinBoard = (e) => {
    e.preventDefault();
    let cleanRoomId = joinRoomInput.trim();
    if (!cleanRoomId) {
      toast.warning('Please enter a Room ID or board URL.');
      return;
    }

    if (cleanRoomId.includes('/board/')) {
      const parts = cleanRoomId.split('/board/');
      cleanRoomId = parts[parts.length - 1].split('?')[0].split('#')[0];
    }
    cleanRoomId = cleanRoomId.replace(/^\/+|\/+$/g, '');

    setIsJoining(true);
    navigate(`/board/${cleanRoomId}`);
  };

  // Delete Snapshot Handler
  const handleDeleteSnapshot = async (snapshotId) => {
    if (!loggedInUser?.email) return;
    try {
      await deleteSnapshotApi({ email: loggedInUser.email, snapshotId });
      setSavedSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
      toast.info('Snapshot deleted');
    } catch {
      toast.error('Failed to delete snapshot');
    }
  };

  // Download .board file
  const handleDownloadFile = (snapshot) => {
    const jsonStr = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${snapshot.title.replace(/\s+/g, '_')}_${snapshot.id}.board`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded .board file to your computer!');
  };

  // Import .board file from disk
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const data = await createBoardApi({
          title: parsed.title || 'Imported Whiteboard',
          userName: loggedInUser?.name || 'Collaborator'
        });
        const targetRoomId = data.board.roomId;

        // Store imported elements in sessionStorage so BoardPage can load them
        if (Array.isArray(parsed.elements)) {
          sessionStorage.setItem(`import_${targetRoomId}`, JSON.stringify(parsed.elements));
        }

        toast.success(`Imported board file! Opening room ${targetRoomId}...`);
        navigate(`/board/${targetRoomId}`);
      } catch {
        toast.error('Invalid .board file structure');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          padding: '0.875rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="wb-logo-icon">
            <Palette size={18} />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            CollabBoard
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
            v2.0 Real-Time
          </span>
        </div>

        {/* Right Nav: Theme Toggle + Health + User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Server Status Badge */}
          {serverHealth && (
            <div
              className={`badge ${serverHealth.database.connected ? 'badge-success' : 'badge-warning'}`}
              title={`Mode: ${serverHealth.database.mode}`}
            >
              <span className={`pulse-dot ${serverHealth.database.connected ? 'online' : 'warning'}`} />
              <span>{serverHealth.database.connected ? 'MongoDB Connected' : 'In-Memory Fallback'}</span>
            </div>
          )}

          {/* Theme Toggle */}
          <button
            onClick={handleToggleTheme}
            className="btn-ghost"
            style={{ width: 34, height: 34, borderRadius: '8px', padding: 0 }}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} style={{ color: '#f59e0b' }} /> : <Moon size={18} style={{ color: '#4f46e5' }} />}
          </button>

          {/* User Profile or Guest Indicator */}
          {loggedInUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.3rem 0.75rem',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  fontSize: '0.84rem',
                  fontWeight: 600
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem'
                  }}
                >
                  {(loggedInUser.name || 'U').charAt(0).toUpperCase()}
                </div>
                <span>{loggedInUser.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-ghost"
                style={{ padding: '0.4rem', color: '#ef4444' }}
                title="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const el = document.getElementById('auth-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-primary btn-sm"
            >
              <LogIn size={14} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* CASE 1: USER IS NOT LOGGED IN -> PROMPT AUTH BEFORE STARTING */}
        {!loggedInUser ? (
          <div style={{ maxWidth: '480px', margin: '2rem auto 4rem', textAlign: 'center' }}>
            <div className="hero-badge" style={{ marginBottom: '1rem' }}>
              <Sparkles size={15} />
              <span>Real-Time Collaborative Whiteboard</span>
            </div>

            <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Sign in to your <span className="hero-title-highlight">CollabBoard</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Sign in with your email to access your personal dashboard, saved boards, snapshots, and start drawing with your team.
            </p>

            {/* Auth Box Card */}
            <div
              id="auth-section"
              style={{
                background: 'var(--bg-surface)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                boxShadow: 'var(--shadow-xl)',
                textAlign: 'left'
              }}
            >
              {/* Tab Switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '3px',
                  marginBottom: '1.5rem'
                }}
              >
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    background: authMode === 'login' ? 'var(--bg-surface)' : 'transparent',
                    color: authMode === 'login' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: authMode === 'login' ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    background: authMode === 'register' ? 'var(--bg-surface)' : 'transparent',
                    color: authMode === 'register' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: authMode === 'register' ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      FULL NAME
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="e.g. Yash"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="input"
                        style={{ paddingLeft: '2.2rem' }}
                        required
                      />
                      <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    EMAIL ADDRESS
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="student@college.edu"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="input"
                      style={{ paddingLeft: '2.2rem' }}
                      required
                    />
                    <Mail size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    PASSWORD
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="input"
                      style={{ paddingLeft: '2.2rem' }}
                      required
                    />
                    <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {authLoading ? 'Processing...' : authMode === 'register' ? 'Create Account' : 'Sign In to Dashboard'}
                </button>
              </form>

              {/* Guest option */}
              <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleGuestContinue}
                  className="btn-ghost"
                  style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}
                >
                  Or quick test as Guest &rarr;
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* CASE 2: USER IS LOGGED IN -> SHOW FULL SAAS DASHBOARD WITH SAVED SNAPSHOTS & CREATE ACTIONS */
          <div>
            {/* Dashboard Welcome Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.05) 100%)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                marginBottom: '2.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}
            >
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                  Welcome back, {loggedInUser.name}!
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
                  {loggedInUser.email} • {savedSnapshots.length} saved whiteboard {savedSnapshots.length === 1 ? 'version' : 'versions'}
                </p>
              </div>

              {/* Import board button */}
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={16} />
                <span>Upload .board File</span>
                <input type="file" accept=".board,.json" onChange={handleImportFile} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Quick Actions Grid: Create Board & Join Board */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
              }}
            >
              {/* Create Board Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PlusCircle size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>New Whiteboard</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Start a live collaborative workspace
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateBoard} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      BOARD TITLE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. System Design v1"
                      className="input"
                      value={boardTitle}
                      onChange={(e) => setBoardTitle(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  >
                    {isCreating ? <span>Launching...</span> : <span>Create & Launch Board</span>}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>

              {/* Join Board Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.75rem',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: 'rgba(219, 39, 119, 0.1)',
                      color: '#db2777',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Share2 size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Join a Board</h3>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      Enter a shared Room ID or paste a link
                    </p>
                  </div>
                </div>

                <form onSubmit={handleJoinBoard} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      ROOM ID OR URL
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. board-a1b2c3d4"
                      className="input"
                      value={joinRoomInput}
                      onChange={(e) => setJoinRoomInput(e.target.value)}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isJoining}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: '0.25rem' }}
                  >
                    <span>Join Room</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            </div>

            {/* SAVED SNAPSHOTS & FILES GALLERY SECTION */}
            <div style={{ marginBottom: '4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FolderClock size={20} style={{ color: 'var(--primary)' }} />
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                    My Saved Files & Snapshots
                  </h2>
                </div>
                <span className="badge badge-indigo">
                  {savedSnapshots.length} {savedSnapshots.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {loadingSnapshots ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading your saved versions...
                </div>
              ) : savedSnapshots.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3.5rem 1.5rem',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--bg-surface)'
                  }}
                >
                  <FileCode size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    No saved snapshots yet
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.5rem' }}>
                    Whenever you draw on a whiteboard, click the "Save Snapshot" icon to freeze and save that exact version here!
                  </p>
                  <button onClick={handleCreateBoard} className="btn btn-primary btn-sm">
                    Create a Board
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem'
                  }}
                >
                  {savedSnapshots.map((snap) => (
                    <div
                      key={snap.id}
                      style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                    >
                      {/* Visual Thumbnail / Screenshot */}
                      <div
                        style={{
                          height: '140px',
                          background: isDarkMode ? '#111217' : '#f8fafc',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        {snap.thumbnail ? (
                          <img
                            src={snap.thumbnail}
                            alt={snap.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                            <Palette size={32} style={{ margin: '0 auto 0.4rem', opacity: 0.5 }} />
                            <span style={{ fontSize: '0.75rem', display: 'block' }}>Canvas Snapshot</span>
                          </div>
                        )}

                        <span
                          className="badge badge-indigo"
                          style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.7rem' }}
                        >
                          Room: {snap.roomId}
                        </span>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
                            {snap.title}
                          </h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            <Clock size={12} />
                            <span>{new Date(snap.savedAt).toLocaleDateString()} at {new Date(snap.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span>{snap.elements?.length || 0} elements</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                          <button
                            onClick={() => handleDownloadFile(snap)}
                            className="btn-ghost"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                            title="Download .board file"
                          >
                            <Download size={14} />
                            <span>.board</span>
                          </button>

                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => handleDeleteSnapshot(snap.id)}
                              className="btn-ghost"
                              style={{ padding: '0.35rem', color: '#ef4444' }}
                              title="Delete snapshot"
                            >
                              <Trash2 size={15} />
                            </button>

                            <button
                              onClick={() => navigate(`/board/${snap.roomId}`)}
                              className="btn btn-primary btn-sm"
                            >
                              <span>Open</span>
                              <ArrowUpRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          padding: '1.75rem 1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.84rem'
        }}
      >
        <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          CollabBoard — Full Stack Development Mini Project
        </p>
        <p>Built with MongoDB, Express.js, React.js, Node.js & Socket.IO</p>
      </footer>
    </div>
  );
}

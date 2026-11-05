import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { loginApi, registerApi } from '../services/api.js';
import { toast } from './Toast.jsx';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter your email and password');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isRegister) {
        if (!name.trim()) {
          toast.warning('Please enter your name');
          setLoading(false);
          return;
        }
        data = await registerApi({ email, name, password });
        toast.success(`Account created! Welcome, ${data.user.name}`);
      } else {
        data = await loginApi({ email, password });
        toast.success(`Welcome back, ${data.user.name}!`);
      }

      localStorage.setItem('collab_user', JSON.stringify(data.user));
      localStorage.setItem('collab_username', data.user.name);

      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card animate-slide-up" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            </div>
            <h3 className="modal-title">{isRegister ? 'Create Account' : 'Sign In'}</h3>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close auth dialog">
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
          {isRegister
            ? 'Sign up to keep your whiteboards, drawings, and snapshots saved under your personal profile.'
            : 'Sign in to access your saved whiteboards and personal snapshots.'}
        </p>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '3px',
            marginBottom: '1.25rem'
          }}
        >
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: !isRegister ? 'var(--bg-surface)' : 'transparent',
              color: !isRegister ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              background: isRegister ? 'var(--bg-surface)' : 'transparent',
              color: isRegister ? 'var(--text-main)' : 'var(--text-muted)',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                FULL NAME
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="e.g. Yash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{ paddingLeft: '2.2rem' }}
                required
              />
              <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

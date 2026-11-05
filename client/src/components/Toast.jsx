import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const listeners = new Set();
const recentMessages = new Map();

export const toast = {
  notify(message, type = 'info', duration = 3000) {
    if (!message) return;

    // Deduplicate identical messages within 3 seconds
    const now = Date.now();
    const lastTime = recentMessages.get(message);
    if (lastTime && now - lastTime < 3000) {
      return;
    }
    recentMessages.set(message, now);

    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    listeners.forEach((callback) => callback({ id, message, type, duration }));
  },
  success(message, duration) {
    this.notify(message, 'success', duration);
  },
  error(message, duration) {
    this.notify(message, 'danger', duration);
  },
  warning(message, duration) {
    this.notify(message, 'warning', duration);
  },
  info(message, duration) {
    this.notify(message, 'info', duration);
  }
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toastItem) => {
      setToasts((prev) => {
        // Keep at most 2 toasts at a time to prevent any screen clutter
        const trimmed = prev.length >= 2 ? prev.slice(-1) : prev;
        return [...trimmed, toastItem];
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toastItem.id));
      }, toastItem.duration);
    };

    listeners.add(handleNewToast);
    return () => listeners.delete(handleNewToast);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
      case 'warning':
        return <AlertTriangle size={16} style={{ color: '#f59e0b' }} />;
      case 'danger':
        return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
      default:
        return <Info size={16} style={{ color: '#4f46e5' }} />;
    }
  };

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((item) => (
        <div key={item.id} className={`toast-item ${item.type} animate-slide-up`}>
          <div style={{ flexShrink: 0 }}>{getIcon(item.type)}</div>
          <div style={{ flex: 1, fontSize: '0.84rem', fontWeight: 500 }}>{item.message}</div>
          <button
            onClick={() => removeToast(item.id)}
            className="btn-ghost"
            style={{ padding: '0.15rem', color: '#94a3b8' }}
            aria-label="Close notification"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;

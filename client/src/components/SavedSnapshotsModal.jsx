import React, { useState, useEffect } from 'react';
import { X, FolderClock, Download, Upload, Trash2, ArrowUpRight, FileCode, Clock } from 'lucide-react';
import { getMySnapshotsApi, deleteSnapshotApi } from '../services/api.js';
import { toast } from './Toast.jsx';

export default function SavedSnapshotsModal({
  isOpen,
  onClose,
  currentUser,
  onLoadSnapshot,
  onImportFile
}) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const userEmail = currentUser?.email || localStorage.getItem('collab_user_email') || 'guest@collabboard.local';

    setLoading(true);
    getMySnapshotsApi(userEmail)
      .then((data) => {
        setSnapshots(data.savedBoards || []);
      })
      .catch((err) => {
        console.warn('Could not fetch snapshots:', err.message);
      })
      .finally(() => setLoading(false));
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleDelete = async (snapshotId) => {
    const userEmail = currentUser?.email || 'guest@collabboard.local';
    try {
      await deleteSnapshotApi({ email: userEmail, snapshotId });
      setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
      toast.info('Snapshot deleted');
    } catch {
      toast.error('Failed to delete snapshot');
    }
  };

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

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.elements)) {
          if (onImportFile) {
            onImportFile(parsed.elements, parsed.title);
          }
          toast.success(`Imported ${parsed.elements.length} elements from file!`);
          onClose();
        } else {
          toast.error('Invalid board file structure');
        }
      } catch {
        toast.error('Could not parse board file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
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
              <FolderClock size={19} />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.15rem' }}>Saved Versions & Snapshots</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Access the static versions you saved at any time
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Top actions: Import file */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            YOUR SAVED SNAPSHOTS ({snapshots.length})
          </span>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={14} />
            <span>Import .board File</span>
            <input type="file" accept=".board,.json" onChange={handleFileInput} style={{ display: 'none' }} />
          </label>
        </div>

        {/* List of snapshots */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading saved versions...
            </div>
          ) : snapshots.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1.5rem',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-muted)'
              }}
            >
              <FileCode size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No saved versions yet</p>
              <p style={{ fontSize: '0.8125rem' }}>
                Click "Save Snapshot" on the whiteboard anytime to preserve this exact version for later!
              </p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div key={snap.id} className="snapshot-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                      {snap.title}
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        {new Date(snap.savedAt).toLocaleString()}
                      </span>
                      <span>•</span>
                      <span>{snap.elements?.length || 0} drawing elements</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(snap.id)}
                    className="btn-ghost"
                    style={{ padding: '0.3rem', color: '#ef4444' }}
                    title="Delete snapshot"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleDownloadFile(snap)}
                    className="btn btn-secondary btn-sm"
                    title="Save .board file to local disk"
                  >
                    <Download size={13} />
                    <span>Download File</span>
                  </button>

                  <button
                    onClick={() => {
                      onLoadSnapshot(snap.elements);
                      toast.success(`Loaded saved snapshot: ${snap.title}`);
                      onClose();
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    <ArrowUpRight size={13} />
                    <span>Load Version</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

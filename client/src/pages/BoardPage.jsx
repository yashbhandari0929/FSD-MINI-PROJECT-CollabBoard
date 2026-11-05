import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Toolbar from '../components/Toolbar.jsx';
import ColorPicker from '../components/ColorPicker.jsx';
import BrushSizeControl from '../components/BrushSizeControl.jsx';
import RemoteCursor from '../components/RemoteCursor.jsx';
import ShareDialog from '../components/ShareDialog.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import AuthModal from '../components/AuthModal.jsx';
import SavedSnapshotsModal from '../components/SavedSnapshotsModal.jsx';
import { toast } from '../components/Toast.jsx';

import { useDrawingHistory } from '../hooks/useDrawingHistory.js';
import { useSocket } from '../hooks/useSocket.js';
import { useCanvas } from '../hooks/useCanvas.js';
import { exportCanvasAsImage, generateOperationId } from '../utils/operationUtils.js';
import { getCanvasCoordinates } from '../utils/canvasUtils.js';
import { saveSnapshotApi } from '../services/api.js';

export default function BoardPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Theme State (Dark Mode vs Light Mode)
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
    setIsDarkMode((prev) => {
      const next = !prev;
      // Adjust brush color intelligently on theme switch if it blends into background
      if (next && (brushColor === '#0f172a' || brushColor === '#1e1b4b')) {
        setBrushColor('#ffffff');
      } else if (!next && brushColor === '#ffffff') {
        setBrushColor('#4f46e5');
      }
      return next;
    });
  };

  // User details & Authentication state
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const stored = localStorage.getItem('collab_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [userName, setUserName] = useState(() => {
    return (
      loggedInUser?.name ||
      localStorage.getItem('collab_username') ||
      `Guest_${Math.floor(Math.random() * 900 + 100)}`
    );
  });

  // Tool & Palette state
  const [activeTool, setActiveTool] = useState('pen');
  const [brushColor, setBrushColor] = useState(() => (isDarkMode ? '#ffffff' : '#4f46e5'));
  const [brushSize, setBrushSize] = useState(4);

  // Dialog & Modal states
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);

  // Inline Text placement state
  const [textPrompt, setTextPrompt] = useState({ isOpen: false, x: 0, y: 0, text: '' });
  const textInputRef = useRef(null);

  // Drawing history hook
  const {
    elements,
    canUndo,
    canRedo,
    addElement,
    addRemoteElement,
    undo: localUndo,
    redo: localRedo,
    clearAll: localClearAll,
    setAllElements
  } = useDrawingHistory([]);

  // Socket communication hook
  const {
    connectionStatus,
    collaborators,
    currentUser,
    remoteCursors,
    emitDrawOperation,
    emitCursorMove,
    emitUndo,
    emitRedo,
    emitClear
  } = useSocket({
    roomId,
    userName,
    onRemoteDraw: (element) => {
      addRemoteElement(element);
    },
    onSyncElements: (syncedElements) => {
      setAllElements(syncedElements);
    },
    onUserJoined: (user) => {
      if (user.userName !== userName) {
        toast.info(`${user.userName} joined the whiteboard`);
      }
    },
    onUserLeft: (leftUserName) => {
      if (leftUserName !== userName) {
        toast.info(`${leftUserName} left`);
      }
    }
  });

  // Local drawing element committed
  const handleCommitElement = useCallback(
    (newElement) => {
      addElement(newElement);
      emitDrawOperation(newElement);
    },
    [addElement, emitDrawOperation]
  );

  // Canvas interaction hook
  const {
    canvasRef,
    canvasDimensions,
    handlePointerDown: basePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave
  } = useCanvas({
    elements,
    activeTool,
    brushColor,
    brushSize,
    onCommitElement: handleCommitElement,
    onCursorMove: emitCursorMove,
    isDarkMode
  });

  // Handle canvas click specifically for Text tool
  const handlePointerDown = (e) => {
    if (activeTool === 'text') {
      const coords = getCanvasCoordinates(e, canvasRef.current);
      setTextPrompt({
        isOpen: true,
        x: coords.x,
        y: coords.y,
        text: ''
      });
      return;
    }
    basePointerDown(e);
  };

  // Focus text input when opened
  useEffect(() => {
    if (textPrompt.isOpen && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textPrompt.isOpen]);

  // Submit text element
  const handleCommitText = (e) => {
    e.preventDefault();
    if (textPrompt.text.trim()) {
      const textElem = {
        id: generateOperationId(),
        type: 'text',
        text: textPrompt.text.trim(),
        x: textPrompt.x,
        y: textPrompt.y,
        color: brushColor,
        fontSize: Math.max(brushSize * 4, 16),
        timestamp: Date.now()
      };
      handleCommitElement(textElem);
    }
    setTextPrompt({ isOpen: false, x: 0, y: 0, text: '' });
  };

  // Image Upload Tool (real image support!)
  const handleAddImage = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, SVG, etc.).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        // Scale down to max 380x380 while preserving aspect ratio
        let w = img.naturalWidth || 300;
        let h = img.naturalHeight || 200;
        const maxDimension = 360;

        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }

        const posX = Math.max(20, Math.round(canvasDimensions.width / 2 - w / 2));
        const posY = Math.max(20, Math.round(canvasDimensions.height / 2 - h / 2));

        const imageElement = {
          id: generateOperationId(),
          type: 'image',
          src: dataUrl,
          x: posX,
          y: posY,
          width: w,
          height: h,
          timestamp: Date.now()
        };

        handleCommitElement(imageElement);
        toast.success('Image placed on canvas!');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Save Version Snapshot on User End (User requested feature!)
  const handleSaveSnapshot = async () => {
    const userEmail = loggedInUser?.email || localStorage.getItem('collab_user_email') || 'guest@collabboard.local';
    const snapshotTitle = prompt('Enter a title for this snapshot version:', `Version at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

    if (snapshotTitle === null) return; // User cancelled prompt

    try {
      const thumbnail = canvasRef.current ? canvasRef.current.toDataURL('image/jpeg', 0.6) : '';
      await saveSnapshotApi({
        email: userEmail,
        roomId,
        title: snapshotTitle.trim() || `Snapshot ${roomId}`,
        elements: [...elements],
        thumbnail
      });

      toast.success('Snapshot saved! You can view this visual snapshot on your dashboard anytime.');
    } catch (err) {
      toast.error(err.message || 'Could not save snapshot');
    }
  };

  // Load a previously saved snapshot into the active board
  const handleLoadSnapshot = (snapshotElements) => {
    if (Array.isArray(snapshotElements)) {
      setAllElements(snapshotElements);
      // Synchronize with room
      for (const el of snapshotElements) {
        emitDrawOperation(el);
      }
    }
  };

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (canUndo) {
      localUndo();
      emitUndo();
    }
  }, [canUndo, localUndo, emitUndo]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (canRedo) {
      localRedo();
      emitRedo();
    }
  }, [canRedo, localRedo, emitRedo]);

  // Clear Canvas Handler
  const handleClear = useCallback(() => {
    localClearAll();
    emitClear();
    toast.info('Canvas cleared');
  }, [localClearAll, emitClear]);

  // Export to PNG Image
  const handleExport = useCallback(() => {
    if (canvasRef.current) {
      exportCanvasAsImage(canvasRef.current, `collabboard-${roomId}.png`);
      toast.success('Downloaded whiteboard as PNG image!');
    }
  }, [roomId, canvasRef]);

  // Auth success callback
  const handleAuthSuccess = (user) => {
    setLoggedInUser(user);
    setUserName(user.name);
  };

  // Logout callback
  const handleLogout = () => {
    localStorage.removeItem('collab_user');
    setLoggedInUser(null);
    toast.info('Signed out');
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="whiteboard-layout">
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        connectionStatus={connectionStatus}
        collaborators={collaborators}
        currentUser={currentUser}
        loggedInUser={loggedInUser}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSnapshots={() => setIsSnapshotsOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Drawing Area */}
      <div className={`wb-canvas-container tool-${activeTool}`}>
        <canvas
          ref={canvasRef}
          className="wb-canvas-element"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />

        {/* Remote Collaborator Cursors */}
        <RemoteCursor remoteCursors={remoteCursors} />

        {/* Floating Vertical Drawing Tools */}
        <Toolbar
          activeTool={activeTool}
          onChangeTool={setActiveTool}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={() => setIsClearConfirmOpen(true)}
          onSaveSnapshot={handleSaveSnapshot}
          onOpenSnapshots={() => setIsSnapshotsOpen(true)}
          onExport={handleExport}
          onAddImage={handleAddImage}
        />

        {/* Floating Bottom Palette & Size Dock */}
        <div className="wb-bottom-dock animate-slide-up">
          <ColorPicker
            selectedColor={brushColor}
            onChangeColor={setBrushColor}
          />

          <div style={{ height: 20, width: 1, background: 'var(--border)' }} />

          <BrushSizeControl
            brushSize={brushSize}
            onChangeSize={setBrushSize}
            brushColor={brushColor}
          />
        </div>

        {/* Inline Text Input Overlay */}
        {textPrompt.isOpen && (
          <form
            onSubmit={handleCommitText}
            style={{
              position: 'absolute',
              left: Math.max(10, textPrompt.x),
              top: Math.max(10, textPrompt.y - 10),
              zIndex: 35,
              background: 'var(--bg-surface)',
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-xl)',
              border: '1.5px solid var(--primary)',
              display: 'flex',
              gap: '0.4rem',
              alignItems: 'center'
            }}
          >
            <input
              ref={textInputRef}
              type="text"
              placeholder="Type text and press Enter..."
              value={textPrompt.text}
              onChange={(e) => setTextPrompt((prev) => ({ ...prev, text: e.target.value }))}
              className="input"
              style={{
                padding: '0.35rem 0.6rem',
                fontSize: `${Math.max(brushSize * 3, 14)}px`,
                color: brushColor,
                minWidth: '220px'
              }}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Place
            </button>
            <button
              type="button"
              onClick={() => setTextPrompt({ isOpen: false, x: 0, y: 0, text: '' })}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
          </form>
        )}
      </div>

      {/* Share Whiteboard Dialog */}
      <ShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        roomId={roomId}
      />

      {/* Clear Canvas Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isClearConfirmOpen}
        title="Clear entire whiteboard?"
        message="This will remove all drawings and shapes on this whiteboard for everyone in the room. You can undo this action afterwards."
        confirmText="Clear Canvas"
        onConfirm={handleClear}
        onCancel={() => setIsClearConfirmOpen(false)}
      />

      {/* Email Login & Registration Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Saved Snapshots & File Library Modal */}
      <SavedSnapshotsModal
        isOpen={isSnapshotsOpen}
        onClose={() => setIsSnapshotsOpen(false)}
        currentUser={loggedInUser}
        onLoadSnapshot={handleLoadSnapshot}
        onImportFile={(importedElements) => handleLoadSnapshot(importedElements)}
      />
    </div>
  );
}

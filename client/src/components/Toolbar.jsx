import React, { useRef } from 'react';
import {
  Pen,
  Eraser,
  Minus,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Trash2,
  Download,
  BookmarkCheck,
  FolderClock
} from 'lucide-react';

export default function Toolbar({
  activeTool,
  onChangeTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onSaveSnapshot,
  onOpenSnapshots,
  onExport,
  onAddImage
}) {
  const fileInputRef = useRef(null);

  const tools = [
    { id: 'pen', label: 'Pen / Freehand', icon: Pen },
    { id: 'eraser', label: 'Eraser', icon: Eraser },
    { id: 'line', label: 'Straight Line', icon: Minus },
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'circle', label: 'Circle / Ellipse', icon: Circle },
    { id: 'text', label: 'Insert Text', icon: Type }
  ];

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onAddImage) {
      onAddImage(file);
    }
    e.target.value = ''; // Reset input
  };

  return (
    <div className="wb-toolbar" role="toolbar" aria-label="Drawing Tools">
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChangeTool(t.id)}
            className={`wb-tool-btn ${isActive ? 'active' : ''}`}
            title={t.label}
            aria-label={t.label}
            aria-pressed={isActive}
          >
            <Icon size={19} />
          </button>
        );
      })}

      {/* Add Image Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="wb-tool-btn"
        title="Add Image to Board"
        aria-label="Upload Image"
      >
        <ImageIcon size={19} />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileChange}
          style={{ display: 'none' }}
        />
      </button>

      <div className="wb-toolbar-divider" />

      {/* Undo */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="wb-tool-btn"
        title="Undo (Ctrl+Z)"
        aria-label="Undo last action"
      >
        <Undo2 size={19} />
      </button>

      {/* Redo */}
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="wb-tool-btn"
        title="Redo (Ctrl+Y)"
        aria-label="Redo last action"
      >
        <Redo2 size={19} />
      </button>

      <div className="wb-toolbar-divider" />

      {/* Save Snapshot */}
      <button
        type="button"
        onClick={onSaveSnapshot}
        className="wb-tool-btn"
        title="Save Version Snapshot (User End)"
        aria-label="Save Version Snapshot"
      >
        <BookmarkCheck size={19} />
      </button>

      {/* My Saved Versions */}
      <button
        type="button"
        onClick={onOpenSnapshots}
        className="wb-tool-btn"
        title="Saved Versions & Snapshots Library"
        aria-label="Saved Versions Library"
      >
        <FolderClock size={19} />
      </button>

      {/* Export as PNG */}
      <button
        type="button"
        onClick={onExport}
        className="wb-tool-btn"
        title="Export as PNG Image"
        aria-label="Export board to PNG"
      >
        <Download size={19} />
      </button>

      {/* Clear Canvas */}
      <button
        type="button"
        onClick={onClear}
        className="wb-tool-btn"
        title="Clear entire canvas"
        aria-label="Clear entire whiteboard"
        style={{ color: '#ef4444' }}
      >
        <Trash2 size={19} />
      </button>
    </div>
  );
}

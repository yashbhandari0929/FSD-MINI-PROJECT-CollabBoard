import React from 'react';

export default function RemoteCursor({ remoteCursors = {} }) {
  const cursorEntries = Object.entries(remoteCursors);

  if (cursorEntries.length === 0) return null;

  return (
    <div className="remote-cursor-container" aria-hidden="true">
      {cursorEntries.map(([socketId, data]) => {
        if (!data || !data.position) return null;
        const { x, y } = data.position;
        const color = data.color || '#4f46e5';
        const name = data.userName || 'Collaborator';

        return (
          <div
            key={socketId}
            className="remote-cursor-item"
            style={{
              transform: `translate3d(${x}px, ${y}px, 0)`
            }}
          >
            {/* SVG Mouse Pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={color}
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
            >
              <polygon points="3 3 10 21 13 14 20 11 3 3" />
            </svg>

            {/* Name Label */}
            <div
              className="remote-cursor-label"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

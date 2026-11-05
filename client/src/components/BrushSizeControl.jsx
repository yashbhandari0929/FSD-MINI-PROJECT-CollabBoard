import React from 'react';

const SIZES = [
  { label: 'Fine', value: 2 },
  { label: 'Normal', value: 4 },
  { label: 'Medium', value: 8 },
  { label: 'Thick', value: 16 },
  { label: 'Heavy', value: 24 }
];

export default function BrushSizeControl({ brushSize, onChangeSize, brushColor }) {
  return (
    <div className="brush-size-options" title="Select stroke thickness">
      {SIZES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => onChangeSize(s.value)}
          className={`brush-size-btn ${brushSize === s.value ? 'active' : ''}`}
          title={`${s.label} (${s.value}px)`}
          aria-label={`Stroke thickness ${s.value} pixels`}
        >
          <div
            className="brush-preview-dot"
            style={{
              width: Math.min(Math.max(s.value, 4), 18),
              height: Math.min(Math.max(s.value, 4), 18),
              backgroundColor: brushColor || '#4f46e5'
            }}
          />
        </button>
      ))}
    </div>
  );
}

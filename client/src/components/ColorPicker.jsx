import React, { useRef } from 'react';
import { Pipette } from 'lucide-react';

const PALETTE = [
  '#0f172a', // Slate Charcoal
  '#4f46e5', // Deep Indigo
  '#2563eb', // Royal Blue
  '#0d9488', // Emerald Teal
  '#16a34a', // Vivid Green
  '#f59e0b', // Vibrant Amber
  '#dc2626', // Crimson Red
  '#9333ea', // Rich Violet
  '#e11d48'  // Rose Pink
];

export default function ColorPicker({ selectedColor, onChangeColor }) {
  const customColorInputRef = useRef(null);

  const handleCustomTrigger = () => {
    if (customColorInputRef.current) {
      customColorInputRef.current.click();
    }
  };

  return (
    <div className="color-swatch-list" title="Select brush color">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChangeColor(c)}
          className={`color-swatch ${selectedColor === c ? 'active' : ''}`}
          style={{ backgroundColor: c }}
          aria-label={`Select color ${c}`}
        />
      ))}

      {/* Custom Color Pipette Button */}
      <button
        type="button"
        onClick={handleCustomTrigger}
        className="btn-ghost"
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          padding: 0,
          border: '1px solid var(--border)',
          background: 'var(--bg-main)',
          color: 'var(--text-muted)'
        }}
        title="Custom Color"
        aria-label="Pick custom color"
      >
        <Pipette size={14} />
      </button>

      <input
        ref={customColorInputRef}
        type="color"
        value={selectedColor}
        onChange={(e) => onChangeColor(e.target.value)}
        className="custom-color-input"
        aria-label="Custom color picker input"
      />
    </div>
  );
}

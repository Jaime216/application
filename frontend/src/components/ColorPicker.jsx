import React from 'react';

const PRESET_COLORS = ['#4f46e5', '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#ec4899', '#a855f7'];

export default function ColorPicker({ id = 'subject-color', value, onChange }) {
  return (
    <div className="color-picker">
      <div className="color-picker-swatches" role="group" aria-label="Colores sugeridos">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-swatch ${value === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            aria-label={`Seleccionar color ${color}`}
            title={color}
          />
        ))}
      </div>

      <div className="color-picker-input">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Selector de color"
        />
        <span>{value}</span>
      </div>
    </div>
  );
}

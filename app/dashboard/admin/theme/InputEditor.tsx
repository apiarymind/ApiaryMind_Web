'use client';

import type { InputSettings } from '@/types/theme';

interface InputEditorProps {
  inputs: InputSettings;
  onChange: (inputs: InputSettings) => void;
}

export function InputEditor({ inputs, onChange }: InputEditorProps) {
  const updateField = <K extends keyof InputSettings>(key: K, value: InputSettings[K]) => {
    onChange({
      ...inputs,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Tło inputów:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={inputs.backgroundColor.startsWith('rgba') ? '#FFFFFF' : inputs.backgroundColor}
            onChange={(e) => {
              // Jeśli kolor jest rgba, parsuj go
              if (inputs.backgroundColor.startsWith('rgba')) {
                const rgbMatch = inputs.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (rgbMatch) {
                  updateField('backgroundColor', `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, 0.8)`);
                } else {
                  updateField('backgroundColor', e.target.value);
                }
              } else {
                updateField('backgroundColor', e.target.value);
              }
            }}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={inputs.backgroundColor}
            onChange={(e) => updateField('backgroundColor', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#FFFFFF lub rgba(...)"
          />
        </div>
      </div>

      {/* Border Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor obramowania inputów:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={inputs.borderColor}
            onChange={(e) => updateField('borderColor', e.target.value)}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={inputs.borderColor}
            onChange={(e) => updateField('borderColor', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#E6D5B8"
          />
        </div>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Zaokrąglenie rogów: {inputs.borderRadius}px
        </label>
        <input
          type="range"
          min="0"
          max="24"
          step="1"
          value={inputs.borderRadius}
          onChange={(e) => updateField('borderRadius', parseInt(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}






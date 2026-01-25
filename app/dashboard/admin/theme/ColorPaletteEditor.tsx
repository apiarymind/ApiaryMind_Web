'use client';

import type { ColorPalette } from '@/types/theme';

interface ColorPaletteEditorProps {
  colors: ColorPalette;
  onChange: (colors: ColorPalette) => void;
}

export function ColorPaletteEditor({ colors, onChange }: ColorPaletteEditorProps) {
  const updateColor = (key: keyof ColorPalette, value: string) => {
    onChange({
      ...colors,
      [key]: value,
    });
  };

  const colorLabels: Record<keyof ColorPalette, string> = {
    primary: 'Primary (Główny)',
    secondary: 'Secondary (Dodatkowy)',
    accent: 'Accent (Złoty Akcent)',
    success: 'Success (Sukces)',
    danger: 'Danger (Błąd)',
  };

  return (
    <div className="space-y-4">
      {(Object.keys(colors) as Array<keyof ColorPalette>).map((key) => (
        <div key={key} className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-text-dark dark:text-amber-100 min-w-[120px]">
            {colorLabels[key]}:
          </label>
          <div className="flex-1 flex items-center gap-3">
            <input
              type="color"
              value={colors[key]}
              onChange={(e) => updateColor(key, e.target.value)}
              className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
            />
            <input
              type="text"
              value={colors[key]}
              onChange={(e) => updateColor(key, e.target.value)}
              className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
              placeholder="#FFC107"
            />
          </div>
        </div>
      ))}
    </div>
  );
}






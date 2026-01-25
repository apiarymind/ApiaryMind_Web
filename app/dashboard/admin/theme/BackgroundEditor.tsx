'use client';

import type { BackgroundSettings } from '@/types/theme';

interface BackgroundEditorProps {
  background: BackgroundSettings;
  onChange: (background: BackgroundSettings) => void;
}

export function BackgroundEditor({ background, onChange }: BackgroundEditorProps) {
  const updateField = <K extends keyof BackgroundSettings>(
    key: K,
    value: BackgroundSettings[K]
  ) => {
    onChange({
      ...background,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Obrazek tła */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Obrazek tła (URL):
        </label>
        <input
          type="text"
          value={background.imageUrl || ''}
          onChange={(e) => updateField('imageUrl', e.target.value || null)}
          className="w-full bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 outline-none focus:border-primary transition-colors"
          placeholder="/assets/bg-light-pattern.png lub URL"
        />
        <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">
          Możesz podać ścieżkę względną (np. /assets/bg.png) lub pełny URL (https://...)
        </p>
      </div>

      {/* Kolor nakładki */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor nakładki:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={background.overlayColor}
            onChange={(e) => updateField('overlayColor', e.target.value)}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={background.overlayColor}
            onChange={(e) => updateField('overlayColor', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#FDFBF7"
          />
        </div>
      </div>

      {/* Przezroczystość nakładki */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Przezroczystość nakładki: {Math.round(background.overlayOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={background.overlayOpacity}
          onChange={(e) => updateField('overlayOpacity', parseFloat(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}






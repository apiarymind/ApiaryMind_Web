'use client';

import type { TypographySettings } from '@/types/theme';

interface TypographyEditorProps {
  typography: TypographySettings;
  onChange: (typography: TypographySettings) => void;
}

export function TypographyEditor({ typography, onChange }: TypographyEditorProps) {
  const updateField = <K extends keyof TypographySettings>(key: K, value: TypographySettings[K]) => {
    onChange({
      ...typography,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Text Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor tekstu głównego:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={typography.textPrimary}
            onChange={(e) => updateField('textPrimary', e.target.value)}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={typography.textPrimary}
            onChange={(e) => updateField('textPrimary', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#3E2723"
          />
        </div>
      </div>

      {/* Secondary Text Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor tekstu dodatkowego:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={typography.textSecondary}
            onChange={(e) => updateField('textSecondary', e.target.value)}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={typography.textSecondary}
            onChange={(e) => updateField('textSecondary', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#5A422D"
          />
        </div>
      </div>

      {/* Muted Text Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor tekstu przygaszonego:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={typography.textMuted}
            onChange={(e) => updateField('textMuted', e.target.value)}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={typography.textMuted}
            onChange={(e) => updateField('textMuted', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#8B6B4E"
          />
        </div>
      </div>
    </div>
  );
}






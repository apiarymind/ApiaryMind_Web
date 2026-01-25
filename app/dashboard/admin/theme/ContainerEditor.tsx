'use client';

import type { ContainerSettings } from '@/types/theme';

interface ContainerEditorProps {
  containers: ContainerSettings;
  onChange: (containers: ContainerSettings) => void;
}

export function ContainerEditor({ containers, onChange }: ContainerEditorProps) {
  const updateField = <K extends keyof ContainerSettings>(key: K, value: ContainerSettings[K]) => {
    onChange({
      ...containers,
      [key]: value,
    });
  };

  const colorLabels: Record<keyof ContainerSettings, string> = {
    bgPrimary: 'Główne tło',
    bgSecondary: 'Dodatkowe tło',
    bgTertiary: 'Trzeciorzędne tło',
    bgHeader: 'Tło nagłówka',
  };

  return (
    <div className="space-y-4">
      {(Object.keys(containers) as Array<keyof ContainerSettings>).map((key) => (
        <div key={key}>
          <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
            {colorLabels[key]}:
          </label>
          <div className="flex items-center gap-3">
            {key !== 'bgHeader' || (containers[key] !== 'transparent' && containers[key] !== '') ? (
              <input
                type="color"
                value={containers[key] === 'transparent' ? '#000000' : (containers[key] || '#000000')}
                onChange={(e) => updateField(key, e.target.value)}
                className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
              />
            ) : null}
            <input
              type="text"
              value={containers[key] || ''}
              onChange={(e) => updateField(key, e.target.value === '' ? 'transparent' : e.target.value)}
              className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
              placeholder={key === 'bgHeader' ? 'transparent lub #FDFBF7' : '#FDFBF7'}
            />
          </div>
          {key === 'bgHeader' && (
            <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">
              Możesz użyć &quot;transparent&quot; dla przezroczystego nagłówka
            </p>
          )}
        </div>
      ))}
    </div>
  );
}



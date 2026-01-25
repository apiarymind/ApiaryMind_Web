'use client';

import { useState, useEffect, useTransition } from 'react';
import type { ThemeSettings, ThemeConfig, ThemeMode } from '@/types/theme';
import { saveThemeSettings } from '@/app/actions/admin/theme-settings';
import { ColorPaletteEditor } from './ColorPaletteEditor';
import { BackgroundEditor } from './BackgroundEditor';
import { CardStylesEditor } from './CardStylesEditor';
import { TypographyEditor } from './TypographyEditor';
import { ContainerEditor } from './ContainerEditor';
import { InputEditor } from './InputEditor';
import { ThemePreview } from './ThemePreview';
import { GlassCard } from '@/app/components/ui/GlassCard';

interface ThemeEditorClientProps {
  initialSettings: ThemeSettings;
}

export default function ThemeEditorClient({ initialSettings }: ThemeEditorClientProps) {
  const [settings, setSettings] = useState<ThemeSettings>(initialSettings);
  const [selectedMode, setSelectedMode] = useState<ThemeMode>('light');
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Aktualizuj podgląd na żywo przy każdej zmianie
  useEffect(() => {
    // Wywołaj custom event, aby ThemeEngineProvider mógł zaktualizować style
    window.dispatchEvent(new Event('theme_settings_updated'));
    
    // Zapisuj do localStorage jako sygnał dla innych zakładek
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme_settings_updated', Date.now().toString());
    }
  }, [settings]);

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveThemeSettings(settings);
      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
        
        // Powiadom wszystkie zakładki o aktualizacji
        window.dispatchEvent(new Event('theme_settings_updated'));
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme_settings_updated', Date.now().toString());
        }
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    });
  };

  const updateConfig = (mode: ThemeMode, updater: (config: ThemeConfig) => ThemeConfig) => {
    setSettings(prev => ({
      ...prev,
      [mode]: updater(prev[mode])
    }));
  };

  const currentConfig = settings[selectedMode];

  return (
    <div className="space-y-6">
      {/* Header z wyborem trybu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-white/10">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedMode('light')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedMode === 'light'
                ? 'bg-primary text-brown-900 shadow-lg'
                : 'bg-white/10 dark:bg-white/10 text-text-dark/60 dark:text-amber-100/60 hover:bg-white/20 dark:hover:bg-white/20'
            }`}
          >
            ☀️ Light Mode
          </button>
          <button
            onClick={() => setSelectedMode('dark')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedMode === 'dark'
                ? 'bg-primary text-brown-900 shadow-lg'
                : 'bg-white/10 dark:bg-white/10 text-text-dark/60 dark:text-amber-100/60 hover:bg-white/20 dark:hover:bg-white/20'
            }`}
          >
            🌙 Dark Mode
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${
            saveStatus === 'success'
              ? 'bg-green-500 text-white'
              : saveStatus === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-primary text-brown-900 hover:bg-amber-400 shadow-lg hover:shadow-xl'
          } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPending ? 'Zapisywanie...' : saveStatus === 'success' ? '✓ Zapisano!' : saveStatus === 'error' ? '✗ Błąd' : '💾 Zapisz Konfigurację'}
        </button>
      </div>

      {/* Layout: Edytory na górze, Podgląd pełny widok na dole */}
      <div className="space-y-6">
        {/* Sekcja Edytorów - Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edytor Palety Kolorów */}
          <GlassCard className="p-6 bg-white/20 dark:bg-black/30">
            <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-4">
              🎨 Paleta Kolorów
            </h2>
            <ColorPaletteEditor
              colors={currentConfig.colors}
              onChange={(colors) => updateConfig(selectedMode, (config) => ({ ...config, colors }))}
            />
          </GlassCard>

          {/* Edytor Tła */}
          <GlassCard className="p-6 bg-white/20 dark:bg-black/30">
            <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-4">
              🖼️ Tło Aplikacji
            </h2>
            <BackgroundEditor
              background={currentConfig.background}
              onChange={(background) => updateConfig(selectedMode, (config) => ({ ...config, background }))}
            />
          </GlassCard>

          {/* Edytor Stylów Kafelków */}
          <GlassCard className="p-6 bg-white/20 dark:bg-black/30">
            <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-4">
              🎴 Style Kafelków
            </h2>
            <CardStylesEditor
              cards={currentConfig.cards}
              onChange={(cards) => updateConfig(selectedMode, (config) => ({ ...config, cards }))}
            />
          </GlassCard>

          {/* Edytor Typografii */}
          <GlassCard className="p-6 bg-white/20 dark:bg-black/30">
            <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-4">
              ✍️ Typografia (Kolory Tekstu)
            </h2>
            <TypographyEditor
              typography={currentConfig.typography}
              onChange={(typography) => updateConfig(selectedMode, (config) => ({ ...config, typography }))}
            />
          </GlassCard>

          {/* Edytor Kontenerów */}
          <GlassCard className="p-6 bg-white/20 dark:bg-black/30">
            <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-4">
              📦 Tła Kontenerów
            </h2>
            <ContainerEditor
              containers={currentConfig.containers}
              onChange={(containers) => updateConfig(selectedMode, (config) => ({ ...config, containers }))}
            />
          </GlassCard>

          {/* Edytor Inputów */}
          <GlassCard className="p-6 bg-white/20 dark:bg-black/30">
            <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-4">
              📝 Style Inputów
            </h2>
            <InputEditor
              inputs={currentConfig.inputs}
              onChange={(inputs) => updateConfig(selectedMode, (config) => ({ ...config, inputs }))}
            />
          </GlassCard>
        </div>

        {/* Pełny widok podglądu na żywo */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-text-dark dark:text-amber-100">
              👁️ Podgląd Pełnego Widoku - {selectedMode === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </h2>
            <p className="text-sm text-text-dark/60 dark:text-amber-200/60 mt-1">
              Pełna symulacja wyglądu aplikacji z wszystkimi elementami UI
            </p>
          </div>
          <ThemePreview config={currentConfig} mode={selectedMode} />
        </div>
      </div>
    </div>
  );
}


import { getThemeSettings } from '@/app/actions/admin/theme-settings';
import ThemeEditorClient from './ThemeEditorClient';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function ThemeEditorPage() {
  const themeSettings = await getThemeSettings();

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-2">Zarządzanie Wyglądem</h1>
      <p className="text-text-dark/60 dark:text-amber-200/60 mb-6 text-sm">
        Edytuj kolory, tła i style kafelków aplikacji. Zmiany są widoczne natychmiast w podglądzie i są zapisywane w bazie danych.
      </p>
      
      <GlassCard className="p-6">
        <ThemeEditorClient initialSettings={themeSettings} />
      </GlassCard>
    </div>
  );
}






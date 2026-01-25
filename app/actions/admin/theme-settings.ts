'use server'

import { createClient } from '@/utils/supabase/server';
import { getCurrentUserProfile } from '@/app/actions/get-user';
import { getSessionUid } from '@/app/actions/auth-session';
import { revalidatePath } from 'next/cache';
import type { ThemeSettings } from '@/types/theme';
import { defaultThemeSettings } from '@/types/theme';

/**
 * Pobiera konfigurację motywów z bazy danych
 * Jeśli nie istnieje, zwraca wartości domyślne
 */
export async function getThemeSettings(): Promise<ThemeSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'theme_settings')
    .single();

  if (error || !data) {
    console.warn('Theme settings not found, using defaults:', error?.message);
    return defaultThemeSettings;
  }

  try {
    const parsed = typeof data.value === 'string' 
      ? JSON.parse(data.value) 
      : data.value;
    
    // Walidacja podstawowa - jeśli struktura jest niepoprawna, zwróć domyślne
    if (!parsed || typeof parsed !== 'object' || !parsed.light || !parsed.dark) {
      console.warn('Invalid theme settings structure, using defaults');
      return defaultThemeSettings;
    }

    // Kompatybilność wsteczna - wypełnij brakujące sekcje wartościami domyślnymi
    const merged: ThemeSettings = {
      light: {
        ...defaultThemeSettings.light,
        ...parsed.light,
        // Merge nested objects
        colors: { ...defaultThemeSettings.light.colors, ...(parsed.light.colors || {}) },
        background: { ...defaultThemeSettings.light.background, ...(parsed.light.background || {}) },
        cards: {
          default: { ...defaultThemeSettings.light.cards.default, ...(parsed.light.cards?.default || {}) },
          accent: { ...defaultThemeSettings.light.cards.accent, ...(parsed.light.cards?.accent || {}) },
          featured: { ...defaultThemeSettings.light.cards.featured, ...(parsed.light.cards?.featured || {}) },
        },
        typography: { ...defaultThemeSettings.light.typography, ...(parsed.light.typography || {}) },
        containers: { ...defaultThemeSettings.light.containers, ...(parsed.light.containers || {}) },
        inputs: { ...defaultThemeSettings.light.inputs, ...(parsed.light.inputs || {}) },
      },
      dark: {
        ...defaultThemeSettings.dark,
        ...parsed.dark,
        // Merge nested objects
        colors: { ...defaultThemeSettings.dark.colors, ...(parsed.dark.colors || {}) },
        background: { ...defaultThemeSettings.dark.background, ...(parsed.dark.background || {}) },
        cards: {
          default: { ...defaultThemeSettings.dark.cards.default, ...(parsed.dark.cards?.default || {}) },
          accent: { ...defaultThemeSettings.dark.cards.accent, ...(parsed.dark.cards?.accent || {}) },
          featured: { ...defaultThemeSettings.dark.cards.featured, ...(parsed.dark.cards?.featured || {}) },
        },
        typography: { ...defaultThemeSettings.dark.typography, ...(parsed.dark.typography || {}) },
        containers: { ...defaultThemeSettings.dark.containers, ...(parsed.dark.containers || {}) },
        inputs: { ...defaultThemeSettings.dark.inputs, ...(parsed.dark.inputs || {}) },
      },
    };

    return merged;
  } catch (e) {
    console.error('Error parsing theme settings:', e);
    return defaultThemeSettings;
  }
}

/**
 * Zapisuje konfigurację motywów do bazy danych
 * Wymaga uprawnień administratora
 */
export async function saveThemeSettings(
  settings: ThemeSettings
): Promise<{ success: boolean; error?: string }> {
  const uid = await getSessionUid();
  if (!uid) {
    return { success: false, error: 'Unauthorized' };
  }

  const profile = await getCurrentUserProfile(uid);
  if (!profile || (profile.system_role !== 'ADMIN' && profile.system_role !== 'SUPER_ADMIN')) {
    return { success: false, error: 'Forbidden - tylko administratorzy mogą edytować motywy' };
  }

  // Walidacja podstawowa
  if (!settings || typeof settings !== 'object' || !settings.light || !settings.dark) {
    return { success: false, error: 'Nieprawidłowa struktura danych motywu' };
  }

  const supabase = createClient();
  
  // Sprawdź czy rekord już istnieje
  const { data: existing } = await supabase
    .from('app_settings')
    .select('id')
    .eq('key', 'theme_settings')
    .single();

  const settingsJson = JSON.stringify(settings);

  if (existing) {
    // Aktualizuj istniejący rekord
    const { error } = await supabase
      .from('app_settings')
      .update({ 
        value: settingsJson,
        updated_at: new Date().toISOString()
      })
      .eq('key', 'theme_settings');

    if (error) {
      console.error('Error updating theme settings:', error);
      return { success: false, error: error.message };
    }
  } else {
    // Utwórz nowy rekord
    const { error } = await supabase
      .from('app_settings')
      .insert({
        key: 'theme_settings',
        value: settingsJson,
        description: 'Konfiguracja motywów aplikacji (Light & Dark Mode)',
        type: 'string',
      });

    if (error) {
      console.error('Error creating theme settings:', error);
      
      // Jeśli błąd wynika z braku tabeli
      if (error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
        return { 
          success: false, 
          error: 'Tabela app_settings nie istnieje w bazie danych. Proszę utworzyć tabelę zgodnie z dokumentacją theme_baza_supabase.md' 
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Revalidacja wszystkich ścieżek, które mogą używać motywów
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard/admin/theme');
  
  return { success: true };
}


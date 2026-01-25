'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUid } from './auth-session';
import { getWarehouseData } from './get-warehouse-data';
import { getUserApiaries } from './get-apiaries';
import { getUserHives } from './get-hives';
import { getCurrentUserProfile } from './get-user';

export interface OnboardingStatus {
  step1_completed: boolean; // warehouse.items.length > 0
  step2_completed: boolean; // apiaries.length > 0
  step3_completed: boolean; // hives.length > 0
  step4_completed: boolean; // legal_status !== null (RHD lub SB)
  currentStep: number; // 1-4, lub 0 jeśli wszystko ukończone
  tutorial_disabled: boolean; // Flaga wyłączenia samouczka (z localStorage lub DB)
  shouldShow: boolean; // Czy samouczek powinien się pokazać (Smart Skip + Opt-Out)
  warehouseItemsCount?: number; // Liczba elementów w magazynie (dla kroku 1)
}

export async function checkOnboardingStatus(): Promise<{ data: OnboardingStatus | null; error: string | null }> {
  try {
    const uid = await getSessionUid();
    if (!uid) {
      return { data: null, error: 'Unauthorized' };
    }

    // Sprawdź wszystkie kroki równolegle
    const [warehouseResult, apiariesResult, hivesResult, profileResult] = await Promise.all([
      getWarehouseData(),
      getUserApiaries(),
      getUserHives(),
      getCurrentUserProfile(uid),
    ]);

    // Krok 1: Warehouse items
    // UWAGA: Krok 1 wymaga ręcznego potwierdzenia przez użytkownika
    // Nie zamykamy go automatycznie po dodaniu pierwszego elementu
    const warehouseItems = warehouseResult.data?.inventory || [];
    const warehouseProducts = warehouseResult.data?.products || [];
    const hasItems = (warehouseItems.length + warehouseProducts.length) > 0;
    const warehouseItemsCount = warehouseItems.length + warehouseProducts.length;
    
    // Sprawdź czy użytkownik ręcznie oznaczył krok 1 jako ukończony
    // To jest sprawdzane po stronie klienta w OnboardingGuide
    // Na poziomie serwera zawsze zwracamy false - klient sprawdzi localStorage
    const step1_completed = false; // Wymaga ręcznego potwierdzenia (sprawdzane po stronie klienta)
    
    // Logowanie dla debugowania
    if (warehouseItemsCount > 0) {
      console.log('[checkOnboardingStatus] ✅ Warehouse has items:', warehouseItemsCount, {
        inventory: warehouseItems.length,
        products: warehouseProducts.length,
        step1_completed,
      });
    }

    // Krok 2: Apiaries
    const apiaries = apiariesResult.data || [];
    const step2_completed = apiaries.length > 0;

    // Krok 3: Hives
    const hives = hivesResult.data || [];
    const step3_completed = hives.length > 0;

    // Krok 4: Legal status (RHD lub SB)
    const hasRhd = profileResult?.rhd && profileResult.rhd.trim() !== '';
    const hasSb = profileResult?.sb && profileResult.sb.trim() !== '';
    const step4_completed = hasRhd || hasSb;

    // Określ aktualny krok (pierwszy nieukończony) - Smart Skip
    let currentStep = 0;
    if (!step1_completed) {
      currentStep = 1;
    } else if (!step2_completed) {
      currentStep = 2;
    } else if (!step3_completed) {
      currentStep = 3;
    } else if (!step4_completed) {
      currentStep = 4;
    }

    // Sprawdź flagę tutorial_disabled (z localStorage jako fallback, jeśli nie ma w DB)
    // TODO: W przyszłości można dodać pole tutorial_disabled do tabeli profiles
    // Na razie używamy localStorage
    const tutorialDisabled = false; // Domyślnie false, będzie sprawdzane po stronie klienta

    // Smart Skip: Jeśli wszystkie kroki są ukończone, nie pokazuj samouczka
    const allStepsCompleted = step1_completed && step2_completed && step3_completed && step4_completed;
    const shouldShow = !allStepsCompleted && currentStep > 0;

    return {
      data: {
        step1_completed,
        step2_completed,
        step3_completed,
        step4_completed,
        currentStep,
        tutorial_disabled: tutorialDisabled,
        shouldShow,
        warehouseItemsCount, // Dodaj liczbę elementów w magazynie
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error checking onboarding status:', error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

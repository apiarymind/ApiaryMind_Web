'use client';

import { useContext } from 'react';
import { OnboardingContext } from './OnboardingContext';

/**
 * Safe hook do używania OnboardingContext - zwraca domyślne wartości jeśli Context nie jest dostępny
 */
export function useOnboardingSafe() {
  try {
    const context = useContext(OnboardingContext);
    if (context) {
      return context;
    }
  } catch {
    // Context nie jest dostępny
  }
  
  // Zwróć domyślne wartości
  return {
    state: 'HIDDEN' as const,
    setState: () => {},
    isBlocking: false,
  };
}

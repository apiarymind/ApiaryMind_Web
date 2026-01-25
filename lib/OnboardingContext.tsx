'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type OnboardingState = 
  | 'STEP_1_PENDING'
  | 'STEP_2_PENDING'
  | 'STEP_3_PENDING'
  | 'STEP_4_PENDING'
  | 'COMPLETED'
  | 'HIDDEN';

interface OnboardingContextType {
  state: OnboardingState;
  setState: (state: OnboardingState) => void;
  currentStep: number; // 1-4, lub 0 jeśli wszystko ukończone
  setCurrentStep: (step: number) => void;
  isBlocking: boolean; // Czy onboarding blokuje dostęp do innych sekcji
  tutorialDisabled: boolean;
  setTutorialDisabled: (disabled: boolean) => void;
}

export const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY_STATE = 'onboarding_state';
const STORAGE_KEY_STEP = 'onboarding_current_step';
const STORAGE_KEY_DISABLED = 'tutorial_disabled';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Inicjalizacja z localStorage (tylko po stronie klienta)
  const [state, setStateInternal] = useState<OnboardingState>(() => {
    if (typeof window === 'undefined') return 'HIDDEN';
    const saved = localStorage.getItem(STORAGE_KEY_STATE);
    return (saved as OnboardingState) || 'HIDDEN';
  });

  const [currentStep, setCurrentStepInternal] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem(STORAGE_KEY_STEP);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [tutorialDisabled, setTutorialDisabledInternal] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY_DISABLED) === 'true';
  });

  // Persystencja do localStorage
  const setState = useCallback((newState: OnboardingState) => {
    setStateInternal(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STATE, newState);
    }
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepInternal(step);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, step.toString());
    }
  }, []);

  const setTutorialDisabled = useCallback((disabled: boolean) => {
    setTutorialDisabledInternal(disabled);
    if (typeof window !== 'undefined') {
      if (disabled) {
        localStorage.setItem(STORAGE_KEY_DISABLED, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_DISABLED);
      }
    }
  }, []);

  // Synchronizacja z localStorage przy zmianie (np. z innej karty)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_STATE && e.newValue) {
        setStateInternal(e.newValue as OnboardingState);
      }
      if (e.key === STORAGE_KEY_STEP && e.newValue) {
        setCurrentStepInternal(parseInt(e.newValue, 10));
      }
      if (e.key === STORAGE_KEY_DISABLED) {
        setTutorialDisabledInternal(e.newValue === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const isBlocking = state !== 'HIDDEN' && state !== 'COMPLETED' && !tutorialDisabled;

  return (
    <OnboardingContext.Provider value={{ 
      state, 
      setState, 
      currentStep,
      setCurrentStep,
      isBlocking,
      tutorialDisabled,
      setTutorialDisabled
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

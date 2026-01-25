'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';

type OnboardingStep = number; // 1, 2, 3, 4, or 5 (Completed)

interface OnboardingContextType {
  currentStep: OnboardingStep;
  isModalOpen: boolean;
  isDemo: boolean;
  completeStep: (step: OnboardingStep) => void;
  setModalOpen: (isOpen: boolean) => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY_STEP = 'onboarding_current_step';

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1); // Default to 1
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize state
  useEffect(() => {
    if (authLoading) return;

    // Check if user is Demo
    const isAnonymous = user?.is_anonymous === true || (!user?.email && user?.app_metadata?.provider === 'anonymous');
    setIsDemo(isAnonymous);

    if (isAnonymous) {
      // Demo Mode: Always start at Step 1
      console.log('[Onboarding] Demo user detected, forcing Step 1');
      setCurrentStep(1);
    } else {
      // Normal Mode: Read from localStorage
      if (typeof window !== 'undefined') {
        const savedStep = localStorage.getItem(STORAGE_KEY_STEP);
        console.log('[Onboarding] Reading from localStorage:', savedStep);
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          if (!isNaN(step) && step >= 1) {
            setCurrentStep(step);
          }
        }
      }
    }
    setInitialized(true);
  }, [user, authLoading]);

  const completeStep = useCallback((step: OnboardingStep) => {
    const nextStep = step + 1;
    console.log('[Onboarding] Completing step:', step, 'Next step:', nextStep);
    setCurrentStep(nextStep);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, nextStep.toString());
    }
  }, []);

  const setModalOpen = useCallback((isOpen: boolean) => {
    console.log('[Onboarding] setModalOpen:', isOpen);
    setIsModalOpen(isOpen);
  }, []);

  const resetOnboarding = useCallback(() => {
    console.log('[Onboarding] Resetting onboarding to Step 1');
    setCurrentStep(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, '1');
    }
  }, []);

  // Don't render until we've checked storage/auth to prevent flash of wrong step
  if (!initialized && !authLoading) {
     // Optional: You could render a null or loader here, but typically context just holds off
     // However, since we default to 1, we can just render.
     // But for "Amnesia" fix, it's better to wait for the effect to fire at least once if we want to be strict.
     // Let's render children only after init to be safe against flashing Step 1 then Step 3.
     return null;
  }

  return (
    <OnboardingContext.Provider value={{ 
      currentStep,
      isModalOpen,
      isDemo,
      completeStep,
      setModalOpen,
      resetOnboarding
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

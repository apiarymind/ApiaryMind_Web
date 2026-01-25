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
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(0); // 0 = initializing
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
      setCurrentStep(1);
    } else {
      // Normal Mode: Read from localStorage
      if (typeof window !== 'undefined') {
        const savedStep = localStorage.getItem(STORAGE_KEY_STEP);
        if (savedStep) {
          setCurrentStep(parseInt(savedStep, 10));
        } else {
          // Default to Step 1 if no history
          setCurrentStep(1);
        }
      }
    }
    setInitialized(true);
  }, [user, authLoading]);

  const completeStep = useCallback((step: OnboardingStep) => {
    const nextStep = step + 1;
    setCurrentStep(nextStep);

    // Persist only for non-demo users (or both, but demo resets anyway)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, nextStep.toString());
    }
  }, []);

  const setModalOpen = useCallback((isOpen: boolean) => {
    setIsModalOpen(isOpen);
  }, []);

  const resetOnboarding = useCallback(() => {
    setCurrentStep(1);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STEP, '1');
    }
  }, []);

  if (!initialized) {
    return null; // Or a loading spinner if needed, but null avoids flash
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

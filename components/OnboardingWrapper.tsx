'use client';

import { ReactNode } from 'react';
import { OnboardingProvider } from '@/lib/OnboardingContext';
import OnboardingWizard from './OnboardingWizard';

export default function OnboardingWrapper({ children }: { children: ReactNode }) {
  return (
    <OnboardingProvider>
      {children}
      <OnboardingWizard />
    </OnboardingProvider>
  );
}

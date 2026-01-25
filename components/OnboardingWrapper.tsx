'use client';

import OnboardingGuide from './OnboardingGuide';

export default function OnboardingWrapper() {
  // Usunięto Suspense - renderujemy od razu, aby modal mógł się pokazać natychmiast
  return <OnboardingGuide />;
}

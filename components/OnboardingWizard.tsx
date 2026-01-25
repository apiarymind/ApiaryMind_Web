'use client';

import { usePathname, useRouter } from 'next/navigation';
import { X, Package, MapPin, Home, FileText } from 'lucide-react';
import { useOnboarding } from '@/lib/OnboardingContext';

// Definition of steps and their target paths
const STEPS = [
  {
    step: 1,
    targetPath: '/dashboard/beekeeper/warehouse',
    icon: Package,
    title: 'KROK 1/4: Zdefiniuj Swój Standard',
    message: 'Zanim postawisz pierwszy ul, system musi wiedzieć, na czym pracujesz. Czy to Wielkopolski, Dadant, czy Warszawski?\n\nDodaj tutaj typy ramek, korpusów i dennic. Dzięki temu później, tworząc ul, wybierzesz tylko gotowy szablon z listy, zamiast wpisywać wymiary ręcznie.',
    buttonLabel: 'Przejdź do konfiguracji Magazynu',
  },
  {
    step: 2,
    targetPath: '/dashboard/beekeeper/apiaries',
    icon: MapPin,
    title: 'KROK 2/4: Utwórz Pasiekę',
    message: 'Ule muszą mieć swój "dom". Utwórz Pasiekę Główną (lub wędrowną) i nadaj jej nazwę.\n\nJeśli dodasz współrzędne GPS, w przyszłości automatycznie pobierzemy dla Ciebie dane pogodowe, kluczowe przy planowaniu przeglądów i karmieniu.',
    buttonLabel: 'Przejdź do Pasiek',
  },
  {
    step: 3,
    targetPath: '/dashboard/hives',
    icon: Home,
    title: 'KROK 3/4: Postaw Pierwszy Ul',
    message: 'Masz już sprzęt (Magazyn) i miejsce (Pasieka). Teraz połączmy to w całość.\n\nKliknij "Dodaj Ul", wybierz jego typ z magazynu i przypisz go do tej pasieki. To tutaj będziesz prowadzić historię rodziny, notować przeglądy i leczenie.',
    buttonLabel: 'Przejdź do Uli',
  },
  {
    step: 4,
    targetPath: '/dashboard/settings',
    icon: FileText,
    title: 'KROK 4/4: Odblokuj Moduł Sprzedaży',
    message: 'Aby system mógł generować legalne raporty i pilnować limitów sprzedaży, musimy znać Twój status prawny.\n\nWybierz: RHD lub Sprzedaż Bezpośrednia (SB) i wpisz numer weterynaryjny.\nUwaga: Bez tych danych moduł "Sprzedaż" oraz "Strażnik Karencji" pozostaną nieaktywne.',
    buttonLabel: 'Przejdź do Ustawień',
  },
];

export default function OnboardingWizard() {
  const { currentStep, isDemo } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();

  // If completed (step > 4), don't show anything
  if (currentStep > 4) return null;

  // Find the current active step configuration
  const activeStepConfig = STEPS.find(s => s.step === currentStep);

  if (!activeStepConfig) return null;

  // Check if we are on the correct path
  // We check if the pathname starts with the target path to allow sub-routes if necessary,
  // but strictly speaking, the prompt says "State A: Wrong Page -> Show Modal".
  const isOnTargetPage = pathname === activeStepConfig.targetPath;

  // If we are on the target page, return null (Footer takes over - State B)
  if (isOnTargetPage) return null;

  const Icon = activeStepConfig.icon;

  const handleNavigate = () => {
    router.push(activeStepConfig.targetPath);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Modal */}
      <div
        className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-amber-500 p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {activeStepConfig.title}
            </h3>
          </div>
        </div>

        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-line">
          {activeStepConfig.message}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleNavigate}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
        >
          {activeStepConfig.buttonLabel}
        </button>

        {/* Demo Indicator (Optional) */}
        {isDemo && (
          <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
            Tryb DEMO: Samouczek jest wymuszony.
          </p>
        )}
      </div>
    </>
  );
}

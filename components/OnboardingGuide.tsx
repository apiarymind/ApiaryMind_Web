'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Package, MapPin, Home, FileText } from 'lucide-react';
import { checkOnboardingStatus } from '@/app/actions/check-onboarding-status';
import { disableTutorial } from '@/app/actions/disable-tutorial';
import { useAuth } from '@/lib/AuthContext';

type OnboardingStep = {
  id: number;
  condition: boolean; // true = krok wymagany (warunek NIE spełniony)
  targetPath: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  buttonLabel: string;
  sectionName: string; // Nazwa sekcji dla przycisku "Przejdź do [Nazwa]"
};

interface OnboardingGuideProps {
  forceStart?: boolean;
  onComplete?: () => void;
}

export default function OnboardingGuide({ forceStart = false, onComplete }: OnboardingGuideProps) {
  const [mounted, setMounted] = useState(false);
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [tutorialDisabled, setTutorialDisabled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  
  // Sprawdź czy użytkownik to DEMO (anonymous user)
  const isDemoUser = user?.is_anonymous === true || (!user?.email && user?.app_metadata?.provider === 'anonymous');
  
  // Debug logging
  useEffect(() => {
    console.log('[OnboardingGuide] Component mounted, pathname:', pathname, 'isDemoUser:', isDemoUser);
  }, [pathname, isDemoUser]);
  
  // DEMO OVERRIDE: Wyczyść localStorage tutorial_* przy inicjalizacji dla DEMO
  useEffect(() => {
    if (isDemoUser && typeof window !== 'undefined') {
      console.log('[OnboardingGuide] DEMO user detected, clearing tutorial flags');
      localStorage.removeItem('tutorial_disabled');
      localStorage.removeItem('tutorial_completed');
      localStorage.removeItem('onboarding_step1_manual_complete');
      // Nie ustawiamy tutorialDisabled na false, bo chcemy wymusić start
    }
  }, [isDemoUser]);

  // Definicja kroków onboardingu
  const getSteps = useCallback((status: any, manualCompletions?: {
    step1?: boolean;
    step2?: boolean;
    step3?: boolean;
    step4?: boolean;
  }, warehouseItemCount?: number): OnboardingStep[] => {
    // Krok 1: Ukończony jeśli ręcznie potwierdzony LUB jeśli są elementy w magazynie (dla pokazania następnego kroku)
    // Ale nadal pokazujemy krok 1, jeśli użytkownik nie kliknął przycisku
    const step1ManuallyCompleted = manualCompletions?.step1 || false;
    const step1HasItems = (warehouseItemCount !== undefined && warehouseItemCount > 0);
    // Krok 1 jest "gotowy" jeśli ma elementy, ale nadal pokazujemy pasek, dopóki użytkownik nie kliknie przycisku
    const step1Complete = step1ManuallyCompleted; // Tylko ręczne potwierdzenie kończy krok 1
    
    const step2Complete = status.step2_completed || manualCompletions?.step2 || false;
    const step3Complete = status.step3_completed || manualCompletions?.step3 || false;
    const step4Complete = status.step4_completed || manualCompletions?.step4 || false;

    return [
      {
        id: 1,
        condition: !step1Complete, // true = krok wymagany
        targetPath: '/dashboard/beekeeper/warehouse',
        icon: Package,
        title: 'KROK 1/4: Zdefiniuj Swój Standard',
        message: 'Zanim postawisz pierwszy ul, system musi wiedzieć, na czym pracujesz. Czy to Wielkopolski, Dadant, czy Warszawski?\n\nDodaj tutaj typy ramek, korpusów i dennic. Dzięki temu później, tworząc ul, wybierzesz tylko gotowy szablon z listy, zamiast wpisywać wymiary ręcznie.',
        buttonLabel: 'Przejdź do konfiguracji Magazynu',
        sectionName: 'Magazynu',
      },
      {
        id: 2,
        condition: !step2Complete, // true = krok wymagany
        targetPath: '/dashboard/beekeeper/apiaries',
        icon: MapPin,
        title: 'KROK 2/4: Utwórz Pasiekę',
        message: 'Ule muszą mieć swój "dom". Utwórz Pasiekę Główną (lub wędrowną) i nadaj jej nazwę.\n\nJeśli dodasz współrzędne GPS, w przyszłości automatycznie pobierzemy dla Ciebie dane pogodowe, kluczowe przy planowaniu przeglądów i karmieniu.',
        buttonLabel: 'Przejdź do Pasiek',
        sectionName: 'Pasiek',
      },
      {
        id: 3,
        condition: !step3Complete, // true = krok wymagany
        targetPath: '/dashboard/hives',
        icon: Home,
        title: 'KROK 3/4: Postaw Pierwszy Ul',
        message: 'Masz już sprzęt (Magazyn) i miejsce (Pasieka). Teraz połączmy to w całość.\n\nKliknij "Dodaj Ul", wybierz jego typ z magazynu i przypisz go do tej pasieki. To tutaj będziesz prowadzić historię rodziny, notować przeglądy i leczenie.',
        buttonLabel: 'Przejdź do Uli',
        sectionName: 'Uli',
      },
      {
        id: 4,
        condition: !step4Complete, // true = krok wymagany
        targetPath: '/dashboard/settings',
        icon: FileText,
        title: 'KROK 4/4: Odblokuj Moduł Sprzedaży',
        message: 'Aby system mógł generować legalne raporty i pilnować limitów sprzedaży, musimy znać Twój status prawny.\n\nWybierz: RHD lub Sprzedaż Bezpośrednia (SB) i wpisz numer weterynaryjny.\nUwaga: Bez tych danych moduł "Sprzedaż" oraz "Strażnik Karencji" pozostaną nieaktywne.',
        buttonLabel: 'Przejdź do Ustawień',
        sectionName: 'Ustawień',
      },
    ];
  }, []);

  // Funkcja sprawdzająca status onboardingu
  const checkOnboarding = useCallback(async () => {
    console.log('[OnboardingGuide] checkOnboarding called, pathname:', pathname, 'forceStart:', forceStart, 'isDemoUser:', isDemoUser);
    
    // DEMO OVERRIDE: Dla DEMO zawsze pokazuj tutorial (ignoruj tutorial_disabled)
    if (!isDemoUser) {
      // Sprawdź czy samouczek jest wyłączony (tylko dla zwykłych użytkowników)
      if (typeof window !== 'undefined') {
        const disabled = localStorage.getItem('tutorial_disabled') === 'true';
        console.log('[OnboardingGuide] tutorial_disabled check:', disabled);
        if (disabled && !forceStart) {
          console.log('[OnboardingGuide] Tutorial disabled, hiding');
          setTutorialDisabled(true);
          setActiveStep(null);
          return;
        }
      }
    }

    setIsChecking(true);
    try {
      // DEMO OVERRIDE: Dla DEMO ignoruj sprawdzenia danych - zawsze wymuś start od Kroku 1
      let status;
      if (isDemoUser) {
        console.log('[OnboardingGuide] DEMO user - bypassing data checks, forcing step 1');
        // Stwórz sztuczny status z wszystkimi krokami jako nieukończone
        status = {
          step1_completed: false,
          step2_completed: false,
          step3_completed: false,
          step4_completed: false,
          currentStep: 1,
          tutorial_disabled: false,
          shouldShow: true,
        };
      } else {
        const result = await checkOnboardingStatus();
        console.log('[OnboardingGuide] checkOnboardingStatus result:', result);
        
        if (result.error || !result.data) {
          console.error('[OnboardingGuide] Error checking status:', result.error);
          setIsChecking(false);
          return;
        }

        status = result.data;
      }

      console.log('[OnboardingGuide] Status:', {
        step1_completed: status.step1_completed,
        step2_completed: status.step2_completed,
        step3_completed: status.step3_completed,
        step4_completed: status.step4_completed,
        currentStep: status.currentStep,
        shouldShow: status.shouldShow,
        pathname,
        isDemoUser
      });

      // Sprawdź ręczne potwierdzenie dla wszystkich kroków
      const manualCompletions = typeof window !== 'undefined' ? {
        step1: localStorage.getItem('onboarding_step1_manual_complete') === 'true',
        step2: localStorage.getItem('onboarding_step2_manual_complete') === 'true',
        step3: localStorage.getItem('onboarding_step3_manual_complete') === 'true',
        step4: localStorage.getItem('onboarding_step4_manual_complete') === 'true',
      } : {
        step1: false,
        step2: false,
        step3: false,
        step4: false,
      };

      // DEMO OVERRIDE: Dla DEMO ignoruj ręczne potwierdzenia (zawsze wymuś start)
      const finalManualCompletions = isDemoUser ? {
        step1: false,
        step2: false,
        step3: false,
        step4: false,
      } : manualCompletions;

      // Pobierz liczbę elementów w magazynie (dla kroku 1)
      // UWAGA: Jeśli step1_completed jest false, sprawdź warehouseItemsCount
      const warehouseItemCount = status.warehouseItemsCount !== undefined 
        ? status.warehouseItemsCount 
        : (status.step1_completed === false ? 0 : undefined);

      console.log('[OnboardingGuide] Manual completions:', finalManualCompletions);
      console.log('[OnboardingGuide] Warehouse item count:', warehouseItemCount);
      console.log('[OnboardingGuide] Full status:', status);

      // Pobierz definicje kroków (z uwzględnieniem ręcznych potwierdzeń i liczby elementów)
      const steps = getSteps(status, finalManualCompletions, warehouseItemCount);

      // KRYTYCZNA LOGIKA: Jeśli krok 1 ma elementy (warehouseItemCount > 0) ale nie jest ręcznie ukończony,
      // pokaż modal dla kroku 2, gdy użytkownik jest na innej stronie niż warehouse
      const step1HasItems = (warehouseItemCount !== undefined && warehouseItemCount > 0);
      const step1ManuallyCompleted = finalManualCompletions.step1;
      const isOnWarehousePage = pathname === '/dashboard/beekeeper/warehouse' || 
                               pathname.startsWith('/dashboard/beekeeper/warehouse/');
      
      console.log('[OnboardingGuide] Step 1 check:', {
        step1HasItems,
        warehouseItemCount,
        step1ManuallyCompleted,
        isOnWarehousePage,
        pathname
      });
      
      // Jeśli krok 1 ma elementy, ale nie jest ukończony ręcznie, i użytkownik jest na innej stronie,
      // pokaż modal dla kroku 2 (pasieki)
      if (step1HasItems && !step1ManuallyCompleted && !isOnWarehousePage) {
        const step2 = steps.find(s => s.id === 2);
        if (step2 && step2.condition) {
          console.log('[OnboardingGuide] ✅ Step 1 has items, showing step 2 modal', {
            pathname,
            warehouseItemCount,
            step1ManuallyCompleted,
            step2Condition: step2.condition
          });
          setActiveStep(step2);
          setIsChecking(false);
          return;
        } else {
          console.log('[OnboardingGuide] ❌ Step 2 not found or condition false', {
            step2Found: !!step2,
            step2Condition: step2?.condition
          });
        }
      } else {
        console.log('[OnboardingGuide] ❌ Step 1 conditions not met for showing step 2 modal', {
          step1HasItems,
          step1ManuallyCompleted,
          isOnWarehousePage
        });
      }

      // Znajdź pierwszy niespełniony krok (condition === true)
      const firstPendingStep = steps.find(step => step.condition === true);
      console.log('[OnboardingGuide] First pending step:', firstPendingStep);

      if (firstPendingStep) {
        // WAŻNE: Modal powinien się pokazywać, gdy użytkownik jest na innej stronie niż docelowa
        // Ale NIE pokazuj modala, jeśli użytkownik jest już na docelowej stronie (tam jest pasek statusu)
        const isOnTargetPage = pathname === firstPendingStep.targetPath || 
                              pathname.startsWith(firstPendingStep.targetPath + '/');
        
        // KRYTYCZNA POPRAWKA: Jeśli użytkownik jest na kroku 3 (Ule), ale ręcznie wszedł do Magazynu
        // NIE BLOKUJ GO - pozwól mu uzupełnić braki (nie pokazuj modala)
        const isStep3Active = firstPendingStep.id === 3;
        
        // POKAZUJ MODAL gdy:
        // 1. Użytkownik NIE jest na docelowej stronie
        // 2. I nie jest to przypadek "krok 3 + magazyn" (gdzie pozwalamy na swobodną nawigację)
        if (isOnTargetPage) {
          // Użytkownik jest na docelowej stronie - pasek statusu jest widoczny, nie pokazuj modala
          console.log('[OnboardingGuide] User is on target page, pasek statusu jest widoczny, hiding modal', {
            pathname,
            targetPath: firstPendingStep.targetPath
          });
          setActiveStep(null);
        } else if (isOnWarehousePage && isStep3Active) {
          // User jest na kroku 3, ale ręcznie wszedł do Magazynu - nie blokuj, nie pokazuj modala
          console.log('[OnboardingGuide] User manually navigated to warehouse during step 3, allowing access', {
            pathname,
            activeStep: firstPendingStep.id
          });
          setActiveStep(null);
        } else {
          // Użytkownik jest na innej stronie (np. /dashboard) - POKAŻ MODAL
          console.log('[OnboardingGuide] Showing modal for step:', firstPendingStep.id, {
            pathname,
            targetPath: firstPendingStep.targetPath,
            isDemoUser
          });
          setActiveStep(firstPendingStep);
        }
      } else {
        console.log('[OnboardingGuide] No pending step found');
        setActiveStep(null);
      }
    } catch (error) {
      console.error('[OnboardingGuide] Error checking onboarding:', error);
    } finally {
      setIsChecking(false);
    }
  }, [pathname, getSteps, forceStart, isDemoUser]);

  // Inicjalizacja - ustaw mounted natychmiast (bez opóźnienia)
  useEffect(() => {
    console.log('[OnboardingGuide] Setting mounted to true');
    setMounted(true);
  }, []);

  // Sprawdź status przy załadowaniu i zmianie ścieżki
  useEffect(() => {
    // Sprawdź od razu, nawet jeśli mounted jeszcze nie jest true
    // (mounted jest używane tylko do renderowania, nie do logiki)
    console.log('[OnboardingGuide] useEffect triggered, mounted:', mounted, 'pathname:', pathname);
    
    // Sprawdź od razu (nie czekaj na mounted)
    checkOnboarding();

    // Polling co 3 sekundy (aby wykryć zmiany w danych)
    pollingIntervalRef.current = setInterval(() => {
      checkOnboarding();
    }, 3000);

    // Nasłuchuj eventu o dodaniu elementu do magazynu
    const handleWarehouseItemAdded = () => {
      console.log('[OnboardingGuide] 📦 Warehouse item added event received!');
      console.log('[OnboardingGuide] Current pathname:', pathname);
      // UWAGA: Po dodaniu elementu strona się odświeża (window.location.reload()),
      // więc event może nie być obsłużony przed reload. Po reload sprawdzenie nastąpi automatycznie.
      // Modal pojawi się gdy użytkownik przejdzie na inną stronę (np. /dashboard),
      // bo na stronie warehouse jest pasek OnboardingFooter.
      console.log('[OnboardingGuide] Will check status after page reload or when user navigates away from warehouse...');
    };
    
    window.addEventListener('warehouse-item-added', handleWarehouseItemAdded);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      window.removeEventListener('warehouse-item-added', handleWarehouseItemAdded);
    };
  }, [pathname, checkOnboarding]); // Usunięto mounted z zależności - sprawdzamy zawsze

  // Obsługa przycisku "Przejdź do..."
  const handleNavigate = () => {
    if (!activeStep) return;

    console.log('[OnboardingGuide] Navigating to:', activeStep.targetPath);
    router.push(activeStep.targetPath);
    // Modal zamknie się automatycznie, gdy użytkownik znajdzie się na docelowej stronie
  };

  // Obsługa wyłączenia samouczka
  const handleDisableTutorial = async () => {
    try {
      localStorage.setItem('tutorial_disabled', 'true');
      await disableTutorial();
      setTutorialDisabled(true);
      setActiveStep(null);
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('[OnboardingGuide] Error disabling tutorial:', error);
    }
  };

  // Nie renderuj niczego, jeśli samouczek wyłączony lub brak aktywnego kroku
  // UWAGA: Usunięto sprawdzanie mounted - renderujemy od razu, jeśli mamy activeStep
  if (tutorialDisabled || !activeStep) {
    if (tutorialDisabled) {
      console.log('[OnboardingGuide] Not rendering - tutorial disabled');
    }
    if (!activeStep) {
      console.log('[OnboardingGuide] Not rendering - no active step');
    }
    return null;
  }
  
  console.log('[OnboardingGuide] Rendering modal for step:', activeStep.id);

  const Icon = activeStep.icon;

  return (
    <>
      {/* Overlay - zablokowane tło */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        style={{ pointerEvents: 'auto' }}
        onClick={handleDisableTutorial}
      />

      {/* Modal z instrukcją */}
      <div
        className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-amber-500 p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-300"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {activeStep.title}
            </h3>
          </div>
          <button
            onClick={handleDisableTutorial}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-line">
          {activeStep.message}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(activeStep.id / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleNavigate}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl mb-3"
        >
          {activeStep.buttonLabel}
        </button>

        {/* Global Opt-Out Button */}
        <button
          onClick={handleDisableTutorial}
          className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 px-4 rounded-lg transition-colors underline"
        >
          Wyłącz samouczek
        </button>
      </div>
    </>
  );
}

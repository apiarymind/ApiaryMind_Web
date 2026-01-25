'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { X, Package, MapPin, Home, FileText, CheckCircle2 } from 'lucide-react';
import { checkOnboardingStatus } from '@/app/actions/check-onboarding-status';
import { useOnboardingSafe } from '@/lib/useOnboardingSafe';
import { disableTutorial } from '@/app/actions/disable-tutorial';

type OnboardingStep = {
  step: number;
  id: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  ui_text: {
    header: string;
    body: string;
    button_label: string;
  };
  actionButton?: {
    label: string;
    onClick: () => void;
  };
};

const ONBOARDING_STEPS: Omit<OnboardingStep, 'actionButton'>[] = [
  {
    step: 1,
    id: 'warehouse_setup',
    route: '/dashboard/beekeeper/warehouse',
    icon: Package,
    ui_text: {
      header: 'KROK 1/4: Zdefiniuj Swój Standard',
      body: 'Zanim postawisz pierwszy ul, system musi wiedzieć, na czym pracujesz. Czy to Wielkopolski, Dadant, czy Warszawski?\n\nDodaj tutaj typy ramek, korpusów i dennic. Dzięki temu później, tworząc ul, wybierzesz tylko gotowy szablon z listy, zamiast wpisywać wymiary ręcznie.',
      button_label: 'Dodaj element magazynu',
    },
  },
  {
    step: 2,
    id: 'apiary_creation',
    route: '/dashboard/beekeeper/apiaries',
    icon: MapPin,
    ui_text: {
      header: 'KROK 2/4: Utwórz Pasiekę',
      body: 'Ule muszą mieć swój "dom". Utwórz Pasiekę Główną (lub wędrowną) i nadaj jej nazwę.\n\nJeśli dodasz współrzędne GPS, w przyszłości automatycznie pobierzemy dla Ciebie dane pogodowe, kluczowe przy planowaniu przeglądów i karmieniu.',
      button_label: 'Utwórz nową pasiekę',
    },
  },
  {
    step: 3,
    id: 'hive_creation',
    route: '/dashboard/hives',
    icon: Home,
    ui_text: {
      header: 'KROK 3/4: Postaw Pierwszy Ul',
      body: 'Masz już sprzęt (Magazyn) i miejsce (Pasieka). Teraz połączmy to w całość.\n\nKliknij "Dodaj Ul", wybierz jego typ z magazynu i przypisz go do tej pasieki. To tutaj będziesz prowadzić historię rodziny, notować przeglądy i leczenie.',
      button_label: 'Dodaj ul',
    },
  },
  {
    step: 4,
    id: 'legal_profile',
    route: '/dashboard/settings',
    icon: FileText,
    ui_text: {
      header: 'KROK 4/4: Odblokuj Moduł Sprzedaży',
      body: 'Aby system mógł generować legalne raporty i pilnować limitów sprzedaży, musimy znać Twój status prawny.\n\nWybierz: RHD lub Sprzedaż Bezpośrednia (SB) i wpisz numer weterynaryjny.\nUwaga: Bez tych danych moduł "Sprzedaż" oraz "Strażnik Karencji" pozostaną nieaktywne.',
      button_label: 'Zapisz dane prawne',
    },
  },
];

type OnboardingState = 
  | 'STEP_1_PENDING'
  | 'STEP_2_PENDING'
  | 'STEP_3_PENDING'
  | 'STEP_4_PENDING'
  | 'COMPLETED'
  | 'HIDDEN';

interface OnboardingWizardProps {
  forceStart?: boolean;
  onComplete?: () => void;
}

export default function OnboardingWizard({ forceStart = false, onComplete }: OnboardingWizardProps) {
  const { state, setState } = useOnboardingSafe();
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [forceMode, setForceMode] = useState(false); // Tryb wymuszony - ignoruje Smart Skip
  const [stateRestored, setStateRestored] = useState(false); // Flaga, aby odtworzyć stan tylko raz
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Funkcja pomocnicza do zapisywania stanu w localStorage
  const saveWizardStateToStorage = useCallback((stepIndex: number, wizardState: OnboardingState) => {
    try {
      localStorage.setItem('wizard_pending_step', String(stepIndex + 1));
      localStorage.setItem('wizard_is_active', 'true');
      localStorage.setItem('wizard_state', wizardState);
      console.log('[OnboardingWizard] Saved wizard state to localStorage:', { stepIndex, wizardState });
    } catch (error) {
      console.error('[OnboardingWizard] Error saving wizard state to localStorage:', error);
    }
  }, []);

  // Funkcja pomocnicza do czyszczenia stanu z localStorage
  const clearWizardStateFromStorage = useCallback(() => {
    try {
      localStorage.removeItem('wizard_pending_step');
      localStorage.removeItem('wizard_is_active');
      localStorage.removeItem('wizard_state');
      console.log('[OnboardingWizard] Cleared wizard state from localStorage');
    } catch (error) {
      console.error('[OnboardingWizard] Error clearing wizard state from localStorage:', error);
    }
  }, []);

  // Funkcja sprawdzająca status onboardingu (z Smart Skip)
  const checkStatus = useCallback(async (ignoreSmartSkip = false) => {
    try {
      // 1. Sprawdź Global Opt-Out (tutorial_disabled) - tylko jeśli nie jest tryb wymuszony
      if (!ignoreSmartSkip && !forceMode) {
        const tutorialDisabled = localStorage.getItem('tutorial_disabled') === 'true';
        if (tutorialDisabled) {
          setState('HIDDEN');
          clearWizardStateFromStorage();
          return;
        }
      }

      const result = await checkOnboardingStatus();
      if (result.error || !result.data) {
        console.error('[OnboardingWizard] Error checking status:', result.error);
        return;
      }

      const status = result.data;
      console.log('[OnboardingWizard] Status check result:', status);
      
      // 2. Smart Skip: Jeśli wszystkie kroki są ukończone, nie pokazuj samouczka
      // (chyba że jest tryb wymuszony)
      if (!ignoreSmartSkip && !forceMode) {
        if (!status.shouldShow || status.currentStep === 0) {
          console.log('[OnboardingWizard] All steps completed or shouldShow=false, hiding');
          setState('HIDDEN');
          clearWizardStateFromStorage();
          return;
        }
      }
      
      // 3. Określ aktualny stan na podstawie statusu kroków
      // W trybie wymuszonym zawsze pokazuj od Kroku 1, ignorując Smart Skip
      if (ignoreSmartSkip || forceMode) {
        // Tryb wymuszony: zawsze startuj od Kroku 1 (nawet jeśli dane są w bazie)
        // Ale sprawdź czy aktualny krok został wykonany i przejdź do następnego
        // W trybie wymuszonym sprawdź czy aktualny krok został wykonany
        // Jeśli tak, przejdź do następnego, jeśli nie - pokaż aktualny
        if (status.step1_completed && currentStepIndex === 0 && state === 'STEP_1_PENDING') {
          // Krok 1 ukończony, przejdź do kroku 2
          const targetStepIndex = 1;
          const targetState: OnboardingState = 'STEP_2_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          router.push(ONBOARDING_STEPS[targetStepIndex].route);
        } else if (status.step2_completed && currentStepIndex === 1 && state === 'STEP_2_PENDING') {
          // Krok 2 ukończony, przejdź do kroku 3
          const targetStepIndex = 2;
          const targetState: OnboardingState = 'STEP_3_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          router.push(ONBOARDING_STEPS[targetStepIndex].route);
        } else if (status.step3_completed && currentStepIndex === 2 && state === 'STEP_3_PENDING') {
          // Krok 3 ukończony, przejdź do kroku 4
          const targetStepIndex = 3;
          const targetState: OnboardingState = 'STEP_4_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          router.push(ONBOARDING_STEPS[targetStepIndex].route);
        } else if (status.step4_completed && currentStepIndex === 3 && state === 'STEP_4_PENDING') {
          // Wszystkie kroki ukończone
          setState('COMPLETED');
          clearWizardStateFromStorage();
          setShowSuccessModal(true);
        } else {
          // Startuj od kroku 1 (jeśli jeszcze nie jesteśmy na kroku 1)
          const targetStepIndex = 0;
          const targetState: OnboardingState = 'STEP_1_PENDING';
          console.log('[OnboardingWizard] Starting from step 1, current state:', state, 'currentStepIndex:', currentStepIndex);
          
          // Ustaw stan PRZED przekierowaniem, aby modal się pokazał
          if (state !== targetState || currentStepIndex !== targetStepIndex) {
            setState(targetState);
            setCurrentStepIndex(targetStepIndex);
            saveWizardStateToStorage(targetStepIndex, targetState);
          }
          
          // Przekieruj tylko jeśli nie jesteśmy już na właściwej stronie
          if (pathname !== ONBOARDING_STEPS[targetStepIndex].route) {
            console.log('[OnboardingWizard] Redirecting to warehouse');
            router.push(ONBOARDING_STEPS[targetStepIndex].route);
          } else {
            // Jesteśmy już na właściwej stronie - upewnij się, że modal jest widoczny
            console.log('[OnboardingWizard] Already on warehouse route, ensuring modal is visible');
          }
        }
      } else {
        // Normalny tryb: Smart Skip - pomija ukończone
        if (!status.step1_completed) {
          console.log('[OnboardingWizard] Step 1 not completed, setting state');
          const targetStepIndex = 0;
          const targetState: OnboardingState = 'STEP_1_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          // Upewnij się, że jesteśmy na właściwej stronie
          if (pathname !== ONBOARDING_STEPS[targetStepIndex].route) {
            router.push(ONBOARDING_STEPS[targetStepIndex].route);
          }
        } else if (!status.step2_completed) {
          console.log('[OnboardingWizard] Step 2 not completed, setting state');
          const targetStepIndex = 1;
          const targetState: OnboardingState = 'STEP_2_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          if (pathname !== ONBOARDING_STEPS[targetStepIndex].route) {
            router.push(ONBOARDING_STEPS[targetStepIndex].route);
          }
        } else if (!status.step3_completed) {
          console.log('[OnboardingWizard] Step 3 not completed, setting state');
          const targetStepIndex = 2;
          const targetState: OnboardingState = 'STEP_3_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          if (pathname !== ONBOARDING_STEPS[targetStepIndex].route) {
            router.push(ONBOARDING_STEPS[targetStepIndex].route);
          }
        } else if (!status.step4_completed) {
          console.log('[OnboardingWizard] Step 4 not completed, setting state');
          const targetStepIndex = 3;
          const targetState: OnboardingState = 'STEP_4_PENDING';
          setState(targetState);
          setCurrentStepIndex(targetStepIndex);
          saveWizardStateToStorage(targetStepIndex, targetState);
          if (pathname !== ONBOARDING_STEPS[targetStepIndex].route) {
            router.push(ONBOARDING_STEPS[targetStepIndex].route);
          }
        } else {
          // Wszystkie kroki ukończone
          if (state !== 'COMPLETED' && state !== 'HIDDEN') {
            console.log('[OnboardingWizard] All steps completed in normal mode');
            setState('COMPLETED');
            clearWizardStateFromStorage();
            setShowSuccessModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  }, [state, setState, setCurrentStepIndex, forceMode, router, pathname, saveWizardStateToStorage, clearWizardStateFromStorage]);

  // Inicjalizacja i polling
  useEffect(() => {
    setMounted(true);
  }, []);

  // KRYTYCZNA POPRAWKA: Odtwarzanie stanu z localStorage po załadowaniu
  useEffect(() => {
    if (!mounted || stateRestored) return;

    // Sprawdź czy jest zapisany stan wizarda w localStorage
    const wizardIsActive = localStorage.getItem('wizard_is_active') === 'true';
    const pendingStep = localStorage.getItem('wizard_pending_step');
    const savedState = localStorage.getItem('wizard_state') as OnboardingState | null;

    if (wizardIsActive && pendingStep && savedState) {
      const stepIndex = parseInt(pendingStep, 10) - 1; // pendingStep to 1-4, stepIndex to 0-3
      const expectedRoute = ONBOARDING_STEPS[stepIndex]?.route;

      console.log('[OnboardingWizard] Restoring wizard state from localStorage:', {
        wizardIsActive,
        pendingStep,
        savedState,
        stepIndex,
        expectedRoute,
        currentPathname: pathname
      });

      // Oznacz, że stan został odtworzony (tylko raz)
      setStateRestored(true);

      // Sprawdź czy jesteśmy na właściwej stronie dla tego kroku
      if (expectedRoute && pathname === expectedRoute) {
        // Jesteśmy na właściwej stronie - przywróć stan i wymuś otwarcie modala
        console.log('[OnboardingWizard] On correct page, restoring state and forcing modal open');
        setState(savedState);
        setCurrentStepIndex(stepIndex);
        
        // Wymuś otwarcie modala z opóźnieniem 500ms (aby upewnić się, że DOM jest gotowy)
        setTimeout(() => {
          console.log('[OnboardingWizard] Forcing modal open after 500ms delay');
          setState(savedState); // Ponownie ustaw stan, aby wymusić render modala
        }, 500);
      } else if (expectedRoute) {
        // Jesteśmy na złej stronie - przekieruj do właściwej
        console.log('[OnboardingWizard] On wrong page, redirecting to:', expectedRoute);
        setState(savedState);
        setCurrentStepIndex(stepIndex);
        router.push(expectedRoute);
        
        // Po przekierowaniu wymuś otwarcie modala
        setTimeout(() => {
          console.log('[OnboardingWizard] Forcing modal open after redirect');
          setState(savedState);
        }, 500);
      }
    } else {
      // Brak zapisanego stanu - oznacz jako odtworzone, aby nie sprawdzać ponownie
      setStateRestored(true);
    }
  }, [mounted, stateRestored, pathname, router, setState, setCurrentStepIndex]);

  // Sprawdź parametr URL force_onboarding (wykonaj jako pierwszy)
  useEffect(() => {
    if (!mounted) return;
    
    const forceParam = searchParams?.get('force_onboarding');
    if (forceParam === 'true') {
      console.log('[OnboardingWizard] Force mode activated from URL');
      // Wymuś start samouczka (ignoruj Smart Skip)
      setForceMode(true);
      localStorage.removeItem('tutorial_completed');
      localStorage.removeItem('tutorial_disabled');
      // Natychmiast ustaw stan i pokaż modal (przed przekierowaniem)
      setState('STEP_1_PENDING');
      setCurrentStepIndex(0);
      // Usuń parametr z URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('force_onboarding');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [mounted, searchParams, setState, setCurrentStepIndex]);

  useEffect(() => {
    if (!mounted) return;

    // Jeśli wymuszony start (z przycisku lub URL), uruchom sprawdzanie w trybie wymuszonym
    if (forceStart || forceMode) {
      console.log('[OnboardingWizard] Force mode active, current state:', state, 'forceMode:', forceMode);
      // W trybie wymuszonym ustaw stan natychmiast, aby modal się pokazał
      if (state === 'HIDDEN') {
        console.log('[OnboardingWizard] Setting state to STEP_1_PENDING from HIDDEN');
        setState('STEP_1_PENDING');
        setCurrentStepIndex(0);
      }
      // Uruchom sprawdzanie po krótkim opóźnieniu, aby dać czas na render modala
      const timeoutId = setTimeout(() => {
        console.log('[OnboardingWizard] Running checkStatus in force mode');
        checkStatus(true); // true = ignoruj Smart Skip
      }, 300);
      return () => clearTimeout(timeoutId);
    }

    // Sprawdź Global Opt-Out i Smart Skip (tylko w normalnym trybie)
    const tutorialDisabled = localStorage.getItem('tutorial_disabled') === 'true';
    if (tutorialDisabled) {
      console.log('[OnboardingWizard] Tutorial disabled, hiding');
      setState('HIDDEN');
      return;
    }

    // Sprawdź status przy załadowaniu (z Smart Skip) - dla nowych użytkowników
    if (pathname?.startsWith('/dashboard')) {
      // Dla nowych użytkowników (brak flagi tutorial_completed) zawsze sprawdź status
      const tutorialCompleted = localStorage.getItem('tutorial_completed');
      const tutorialDisabledCheck = localStorage.getItem('tutorial_disabled');
      console.log('[OnboardingWizard] Checking for new user:', { tutorialCompleted, tutorialDisabled: tutorialDisabledCheck, pathname, currentState: state });
      if (tutorialCompleted !== 'true' && tutorialDisabledCheck !== 'true') {
        // Nowy użytkownik - sprawdź status i pokaż samouczek jeśli potrzeba
        console.log('[OnboardingWizard] New user detected, checking status...');
        checkStatus(false); // false = użyj Smart Skip
      }
    }
  }, [mounted, forceStart, forceMode, pathname, checkStatus, setState, state, setCurrentStepIndex]);

  // Polling - sprawdzaj status co 3 sekundy
  useEffect(() => {
    if (state === 'HIDDEN' || state === 'COMPLETED') {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Sprawdź Global Opt-Out przed uruchomieniem pollingu (tylko jeśli nie jest tryb wymuszony)
    if (!forceMode) {
      const tutorialDisabled = localStorage.getItem('tutorial_disabled') === 'true';
      if (tutorialDisabled) {
        setState('HIDDEN');
        return;
      }
    }

    // Uruchom polling (w trybie wymuszonym ignoruj Smart Skip)
    pollingIntervalRef.current = setInterval(() => {
      checkStatus(forceMode); // W trybie wymuszonym ignoruj Smart Skip
    }, 3000); // Co 3 sekundy

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [state, checkStatus, forceMode, setState]);

  // Przekieruj do właściwej strony gdy zmienia się stan
  useEffect(() => {
    if (state === 'HIDDEN' || state === 'COMPLETED') return;

    const step = ONBOARDING_STEPS[currentStepIndex];
    if (step && pathname !== step.route) {
      console.log('[OnboardingWizard] Redirecting to step route:', step.route, 'from:', pathname);
      router.push(step.route);
    }
  }, [state, currentStepIndex, pathname, router]);

  // KRYTYCZNA POPRAWKA UX: Pokazuj modal natychmiast po przekierowaniu na właściwą stronę
  useEffect(() => {
    if (!mounted) return;
    if (state === 'HIDDEN' || state === 'COMPLETED') return;

    const step = ONBOARDING_STEPS[currentStepIndex];
    if (!step) return;

    // Jeśli jesteśmy na właściwej stronie dla aktualnego kroku, upewnij się, że modal jest widoczny
    if (pathname === step.route) {
      console.log('[OnboardingWizard] ✅ On correct route for step, ensuring modal is visible:', {
        pathname,
        stepRoute: step.route,
        currentState: state,
        stepIndex: currentStepIndex,
        expectedState: `STEP_${currentStepIndex + 1}_PENDING`
      });

      // Jeśli stan nie jest ustawiony na odpowiedni PENDING, ustaw go natychmiast
      const expectedState = `STEP_${currentStepIndex + 1}_PENDING` as OnboardingState;
      if (state !== expectedState) {
        console.log('[OnboardingWizard] ⚠️ State mismatch detected! Setting to:', expectedState, 'from:', state);
        setState(expectedState);
      }
    }
  }, [mounted, pathname, currentStepIndex, state, setState]);

  // KRYTYCZNA POPRAWKA: Pokazuj modal natychmiast po przekierowaniu na właściwą stronę
  useEffect(() => {
    if (!mounted) return;
    if (state === 'HIDDEN' || state === 'COMPLETED') return;

    const step = ONBOARDING_STEPS[currentStepIndex];
    if (!step) return;

    // Jeśli jesteśmy na właściwej stronie dla aktualnego kroku, upewnij się, że modal jest widoczny
    if (pathname === step.route) {
      console.log('[OnboardingWizard] On correct route for step, ensuring modal is visible:', {
        pathname,
        stepRoute: step.route,
        currentState: state,
        stepIndex: currentStepIndex
      });

      // Jeśli stan nie jest ustawiony na odpowiedni PENDING, ustaw go
      const expectedState = `STEP_${currentStepIndex + 1}_PENDING` as OnboardingState;
      if (state !== expectedState) {
        console.log('[OnboardingWizard] State mismatch, setting to:', expectedState);
        setState(expectedState);
      }
    }
  }, [mounted, pathname, currentStepIndex, state, setState]);

  // Stan jest już zarządzany przez Context, więc nie trzeba powiadamiać parenta

  const handleActionButtonClick = () => {
    // Zamknij modal i pozwól użytkownikowi działać
    // Modal automatycznie się pojawi ponownie po wykryciu sukcesu przez polling
    // Nie zamykamy całkowicie - tylko ukrywamy modal
  };

  const handleDisableTutorial = async () => {
    // Global Opt-Out: Zapisz flagę w localStorage i wywołaj server action
    localStorage.setItem('tutorial_disabled', 'true');
    await disableTutorial();
    setState('HIDDEN');
    clearWizardStateFromStorage();
    if (onComplete) {
      onComplete();
    }
  };

  const handleClose = () => {
    // Zwykłe zamknięcie - nie wyłącza samouczka trwale
    // NIE czyść localStorage - użytkownik może wrócić do tego kroku
    setState('HIDDEN');
    if (onComplete) {
      onComplete();
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setState('HIDDEN');
    localStorage.setItem('tutorial_completed', 'true');
    clearWizardStateFromStorage();
    if (onComplete) {
      onComplete();
    }
  };

  // Funkcje akcji dla przycisków
  const getActionButtonHandler = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // Warehouse
        return () => {
          // Otwórz modal dodawania elementu magazynu
          const addButton = document.querySelector('[data-onboarding-action="add-warehouse"]') as HTMLElement;
          if (addButton) {
            addButton.click();
          } else {
            // Fallback: znajdź przycisk "Dodaj" na stronie magazynu
            const buttons = document.querySelectorAll('button');
            const addBtn = Array.from(buttons).find(btn => 
              btn.textContent?.toLowerCase().includes('dodaj') || 
              btn.textContent?.toLowerCase().includes('add')
            );
            if (addBtn) {
              (addBtn as HTMLElement).click();
            }
          }
        };
      case 1: // Apiary
        return () => {
          const addButton = document.querySelector('[data-onboarding-action="add-apiary"]') as HTMLElement;
          if (addButton) {
            addButton.click();
          } else {
            const buttons = document.querySelectorAll('button');
            const addBtn = Array.from(buttons).find(btn => 
              btn.textContent?.toLowerCase().includes('dodaj') || 
              btn.textContent?.toLowerCase().includes('utwórz') ||
              btn.textContent?.toLowerCase().includes('create')
            );
            if (addBtn) {
              (addBtn as HTMLElement).click();
            }
          }
        };
      case 2: // Hive
        return () => {
          const addButton = document.querySelector('[data-onboarding-action="add-hive"]') as HTMLElement;
          if (addButton) {
            addButton.click();
          } else {
            const buttons = document.querySelectorAll('button');
            const addBtn = Array.from(buttons).find(btn => 
              btn.textContent?.toLowerCase().includes('dodaj') || 
              btn.textContent?.toLowerCase().includes('add')
            );
            if (addBtn) {
              (addBtn as HTMLElement).click();
            }
          }
        };
      case 3: // Settings
        return () => {
          // Przekieruj do zakładki "Dane Weterynaryjne" w ustawieniach
          router.push('/dashboard/settings?veterinary');
          // Scroll do sekcji statusu prawnego
          setTimeout(() => {
            const legalSection = document.querySelector('[data-onboarding-section="legal-status"]');
            if (legalSection) {
              legalSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        };
      default:
        return () => {};
    }
  };

  if (!mounted || state === 'HIDDEN') {
    return null;
  }

  // Modal sukcesu
  if (showSuccessModal && state === 'COMPLETED') {
    return (
      <>
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]" />
        <div
          className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-green-500 p-8 max-w-md w-full mx-4"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              System Gotowy do Pracy!
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              Świetnie! Twoja pasieka jest skonfigurowana. Możesz teraz bezpiecznie planować zadania, prowadzić ewidencję leczenia i sprzedawać produkty zgodnie z prawem.
            </p>
            <button
              onClick={handleSuccessModalClose}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
            >
              Rozpocznij pracę
            </button>
          </div>
        </div>
      </>
    );
  }

  // Zwykły modal dla kroku
  if (state === 'COMPLETED') {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStepIndex];
  if (!step) return null;

  const Icon = step.icon;
  const actionHandler = getActionButtonHandler(currentStepIndex);

  return (
    <>
      {/* Overlay - zablokowane tło */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Tooltip z instrukcją */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-amber-500 p-6 max-w-md w-full mx-4"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
            <Icon className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {step.ui_text.header}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed whitespace-pre-line">
          {step.ui_text.body}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={actionHandler}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl mb-3"
        >
          {step.ui_text.button_label}
        </button>

        {/* Global Opt-Out Button (Secondary Action) */}
        <button
          onClick={handleDisableTutorial}
          className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 py-2 px-4 rounded-lg transition-colors underline"
        >
          Pomiń konfigurację i wyłącz samouczek
        </button>
      </div>
    </>
  );
}

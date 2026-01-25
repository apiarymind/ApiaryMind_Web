'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Info, MapPin, Home, FileText, Package } from 'lucide-react';
import { checkOnboardingStatus } from '@/app/actions/check-onboarding-status';
import { useAuth } from '@/lib/AuthContext';
import { disableTutorial } from '@/app/actions/disable-tutorial';
import OnboardingSuccessModal from './OnboardingSuccessModal';

type OnboardingStep = 1 | 2 | 3 | 4;
type IconName = 'Package' | 'MapPin' | 'Home' | 'FileText';

interface OnboardingFooterProps {
  step: OnboardingStep;
  count?: number; // Liczba elementów (dla kroków 1-3)
  statusText?: string; // Tekst statusu (dla kroku 4)
  iconName: IconName; // Nazwa ikony zamiast komponentu
  infoText: string;
  buttonLabel: string;
}

// Mapowanie nazw ikon do komponentów
const iconMap: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Package,
  MapPin,
  Home,
  FileText,
};

export default function OnboardingFooter({
  step,
  count,
  statusText,
  iconName,
  infoText,
  buttonLabel
}: OnboardingFooterProps) {
  const Icon = iconMap[iconName];
  const [isCompleting, setIsCompleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  // Sprawdź czy użytkownik to DEMO (anonymous user)
  const isDemoUser = user?.is_anonymous === true || (!user?.email && user?.app_metadata?.provider === 'anonymous');

  // Wykrywanie otwartych modali - sprawdzaj DOM dla elementów modalnych
  useEffect(() => {
    let checkTimeout: NodeJS.Timeout | null = null;
    
    const checkForModals = () => {
      if (typeof window === 'undefined') return;

      let foundModal = false;

      // Metoda 1: Sprawdź elementy z wysokim z-index (z-[50] i wyżej) i fixed position
      // To jest najszybsze i najbardziej niezawodne
      const highZIndexElements = document.querySelectorAll('*');
      
      for (let i = 0; i < highZIndexElements.length; i++) {
        const el = highZIndexElements[i] as HTMLElement;
        const styles = window.getComputedStyle(el);
        const zIndex = parseInt(styles.zIndex);
        const position = styles.position;

        // Sprawdź tylko elementy z z-index >= 50 i fixed/absolute position
        if (zIndex >= 50 && (position === 'fixed' || position === 'absolute')) {
          const rect = el.getBoundingClientRect();
          const isVisible = styles.display !== 'none' && 
                          styles.visibility !== 'hidden' && 
                          parseFloat(styles.opacity) > 0;
          
          // Modal powinien być widoczny i zajmować znaczną część ekranu
          const isLarge = rect.width > 200 && rect.height > 100;
          const isInViewport = rect.top < window.innerHeight && rect.bottom > 0 && 
                              rect.left < window.innerWidth && rect.right > 0;
          
          if (isVisible && isLarge && isInViewport) {
            // Wyklucz OnboardingFooter i OnboardingGuide
            const classList = Array.from(el.classList);
            const id = el.id || '';
            const isOnboardingElement = 
              classList.some(cls => cls.toLowerCase().includes('onboarding')) ||
              id.toLowerCase().includes('onboarding') ||
              el.closest('[class*="onboarding"]') !== null;

            // Wyklucz też elementy, które są częścią OnboardingFooter
            const isPartOfOnboarding = el.closest('[class*="z-[9997]"]') !== null && 
                                       el.closest('[class*="z-[9998]"]') === null &&
                                       el.closest('[class*="z-[9999]"]') === null;

            if (!isOnboardingElement && !isPartOfOnboarding) {
              foundModal = true;
              break; // Znaleziono modal, nie trzeba dalej szukać
            }
          }
        }
      }

      setIsAnyModalOpen(foundModal);
    };

    // Funkcja z debounce - opóźnia sprawdzenie, aby dać czas na animację zamknięcia
    const debouncedCheck = () => {
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
      checkTimeout = setTimeout(() => {
        checkForModals();
      }, 100); // 100ms opóźnienie po zamknięciu modala
    };

    // Sprawdź od razu
    checkForModals();

    // Sprawdź co 300ms (wystarczająco często, aby wykryć otwarcie modala)
    const interval = setInterval(checkForModals, 300);

    // Użyj MutationObserver do wykrywania zmian w DOM (dodanie/usunięcie elementów)
    const observer = new MutationObserver((mutations) => {
      // Sprawdź tylko jeśli dodano/usunięto elementy lub zmieniono klasy/style
      const hasRelevantChanges = mutations.some(mutation => 
        mutation.type === 'childList' || 
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'class' || mutation.attributeName === 'style'))
      );
      
      if (hasRelevantChanges) {
        // Użyj debounced check, aby dać czas na animację zamknięcia
        debouncedCheck();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    // Nasłuchuj custom event "modal-closed" (można go wywołać z modala)
    const handleModalClosed = () => {
      // Wymuś sprawdzenie po zamknięciu modala z większym opóźnieniem
      setTimeout(() => {
        checkForModals();
        // Dodatkowe sprawdzenie po animacji (500ms)
        setTimeout(checkForModals, 500);
      }, 100);
    };

    window.addEventListener('modal-closed', handleModalClosed);

    return () => {
      clearInterval(interval);
      if (checkTimeout) {
        clearTimeout(checkTimeout);
      }
      observer.disconnect();
      window.removeEventListener('modal-closed', handleModalClosed);
    };
  }, []);

  // Sprawdź czy krok jest aktywny i nie jest ukończony
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkOnboardingStatus();
        if (result.error || !result.data) {
          setIsVisible(false);
          return;
        }

        const status = result.data;
        
        // Sprawdź czy krok jest ręcznie ukończony
        const stepKey = `onboarding_step${step}_manual_complete` as const;
        const stepManuallyCompleted = typeof window !== 'undefined' 
          ? localStorage.getItem(stepKey) === 'true'
          : false;

        // Sprawdź czy krok jest ukończony w bazie
        let stepCompleted = false;
        if (step === 1) {
          // Krok 1: Pokazuj pasek jeśli są elementy w magazynie (count > 0) I użytkownik NIE kliknął przycisku
          // Pasek powinien być widoczny, jeśli są elementy, nawet jeśli użytkownik nie kliknął przycisku
          const hasItems = (count !== undefined && count > 0);
          // Ukryj tylko jeśli: użytkownik ręcznie ukończył LUB brak elementów
          stepCompleted = stepManuallyCompleted || !hasItems;
        } else if (step === 2) {
          stepCompleted = status.step2_completed || stepManuallyCompleted;
        } else if (step === 3) {
          stepCompleted = status.step3_completed || stepManuallyCompleted;
        } else if (step === 4) {
          stepCompleted = status.step4_completed || stepManuallyCompleted;
        }

        // DEMO OVERRIDE: Dla DEMO zawsze pokazuj pasek jeśli krok nie jest ukończony
        if (isDemoUser) {
          setIsVisible(!stepCompleted);
        } else {
          // Normalna logika: pokazuj pasek jeśli krok nie jest ukończony
          setIsVisible(!stepCompleted);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setIsVisible(false);
      }
    };

    checkStatus();
    
    // Sprawdź również co 2 sekundy (gdy użytkownik dodaje elementy)
    const interval = setInterval(checkStatus, 2000);
    
    // Nasłuchuj eventu o dodaniu elementu do magazynu
    const handleWarehouseItemAdded = () => {
      console.log('[OnboardingFooter] Warehouse item added, refreshing status...');
      checkStatus();
    };
    
    window.addEventListener('warehouse-item-added', handleWarehouseItemAdded);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('warehouse-item-added', handleWarehouseItemAdded);
    };
  }, [step, count, statusText, isDemoUser]);

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Oznacz krok jako ręcznie ukończony
      const stepKey = `onboarding_step${step}_manual_complete`;
      if (typeof window !== 'undefined') {
        localStorage.setItem(stepKey, 'true');
      }
      
      // Krok 4 - specjalna logika: wyłącz tutorial i pokaż modal sukcesu
      if (step === 4) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('tutorial_completed', 'true');
          localStorage.setItem('tutorial_disabled', 'true');
        }
        await disableTutorial();
        setShowSuccessModal(true);
        setIsVisible(false);
        return;
      }
      
      // Kroki 1-3: przekieruj do następnego kroku
      if (step === 1) {
        router.push('/dashboard/beekeeper/apiaries');
      } else if (step === 2) {
        router.push('/dashboard/hives');
      } else if (step === 3) {
        router.push('/dashboard/settings');
      }
      
      // Odśwież stronę, aby system wykrył zmianę
      router.refresh();
      
      // Ukryj pasek
      setIsVisible(false);
    } catch (error) {
      console.error('Error completing step:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // DIAGNOSTYKA: Loguj stan komponentu przy każdym renderze
  useEffect(() => {
    console.log('[OnboardingFooter] MOUNTED/RENDERED. Step:', step, 'isVisible:', isVisible, 'isAnyModalOpen:', isAnyModalOpen);
  }, [step, isVisible, isAnyModalOpen]);

  // CRITICAL FIX: ZAWSZE RENDERUJ - nie usuwaj z DOM!
  // Używamy CSS transform zamiast usuwania z DOM, aby pasek zawsze wracał po zamknięciu modala
  // Jeśli pasek nie powinien być widoczny (krok ukończony lub modal otwarty), ukryj go za pomocą CSS
  
  // Oblicz transform: jeśli modal jest otwarty LUB krok jest ukończony -> ukryj
  const shouldHide = isAnyModalOpen || !isVisible;
  const transformY = shouldHide ? 'translateY(110%)' : 'translateY(0)';

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 md:left-[288px] z-[9997] bg-amber-500 border-t-2 border-amber-600 shadow-2xl transition-transform duration-300 ease-in-out"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 9997, // Niższy niż modal (9999), ale wyższy niż większość elementów
        backgroundColor: '#F59E0B', // Amber-500 - wymuszone
        padding: '1rem',
        boxShadow: '0 -4px 6px rgba(0,0,0,0.1)',
        transform: transformY, // CSS transform zamiast usuwania z DOM
        willChange: 'transform', // Optymalizacja animacji
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Left: Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-5 h-5 text-black" />
              <span className="font-bold text-black">
                {count !== undefined && (
                  <>
                    {step === 1 && 'Elementy w magazynie: '}
                    {step === 2 && 'Utworzone pasieki: '}
                    {step === 3 && 'Postawione ule: '}
                    <span className="text-amber-900">{count}</span>
                  </>
                )}
                {statusText && (
                  <>
                    Status prawny: <span className="text-amber-900">{statusText}</span>
                  </>
                )}
              </span>
            </div>
            
            {/* Educational Content */}
            <div className="bg-amber-400/30 border border-amber-600/30 rounded-lg p-3 mb-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-900 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="whitespace-pre-line">{infoText}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Button */}
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-black font-bold px-6 py-3 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-700"
          >
            {isCompleting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Przetwarzanie...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>{buttonLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Sukcesu - tylko dla kroku 4 */}
      {step === 4 && (
        <OnboardingSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

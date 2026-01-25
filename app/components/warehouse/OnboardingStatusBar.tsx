'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, CheckCircle2, Info } from 'lucide-react';
import { checkOnboardingStatus } from '@/app/actions/check-onboarding-status';
import { useAuth } from '@/lib/AuthContext';

interface OnboardingStatusBarProps {
  inventoryCount: number;
  productsCount: number;
}

export default function OnboardingStatusBar({ inventoryCount, productsCount }: OnboardingStatusBarProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const totalCount = inventoryCount + productsCount;
  
  // Sprawdź czy użytkownik to DEMO (anonymous user)
  const isDemoUser = user?.is_anonymous === true || (!user?.email && user?.app_metadata?.provider === 'anonymous');

  // Sprawdź czy krok 1 jest już ukończony
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Sprawdź czy użytkownik ręcznie oznaczył krok jako ukończony
        const step1ManuallyCompleted = typeof window !== 'undefined' 
          ? localStorage.getItem('onboarding_step1_manual_complete') === 'true'
          : false;
        
        // DEMO OVERRIDE: Dla DEMO pasek jest zawsze aktywny (niezależnie od totalCount)
        // Użytkownik Demo może przeklikać się przez przewodnik bez dodawania danych
        if (isDemoUser) {
          if (!step1ManuallyCompleted) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        } else {
          // Normalna logika: Pokaż pasek tylko jeśli:
          // 1. Są elementy w magazynie (totalCount > 0)
          // 2. Krok 1 nie jest ręcznie ukończony
          if (totalCount > 0 && !step1ManuallyCompleted) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };

    checkStatus();
    
    // Sprawdź również przy zmianie totalCount (gdy użytkownik dodaje elementy)
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [totalCount, isDemoUser]);

  const handleCompleteStep = async () => {
    setIsCompleting(true);
    try {
      // Oznacz krok 1 jako ręcznie ukończony
      if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_step1_manual_complete', 'true');
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

  if (!isVisible || totalCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-[288px] z-[9997] bg-amber-500 border-t-2 border-amber-600 shadow-2xl">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Left: Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-black" />
              <span className="font-bold text-black">
                Elementy w magazynie: <span className="text-amber-900">{totalCount}</span>
              </span>
            </div>
            
            {/* Educational Content */}
            <div className="bg-amber-400/30 border border-amber-600/30 rounded-lg p-3 mb-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-900 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-1">Skompletuj pełny zestaw!</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><strong>Ul Korpusowy (Stojak):</strong> Wymaga min. 1 Dennicy, 1 Korpusu i 1 Daszka.</li>
                    <li><strong>Ul Leżak:</strong> Wymaga tylko wyboru typu ula.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Action Button */}
          <button
            onClick={handleCompleteStep}
            disabled={isCompleting}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-black font-bold px-6 py-3 rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-700"
          >
            {isCompleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Przetwarzanie...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Mam już wszystko, przejdź do Pasieki &gt;&gt;</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

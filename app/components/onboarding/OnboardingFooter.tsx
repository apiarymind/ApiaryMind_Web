'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Info, MapPin, Home, FileText, Package } from 'lucide-react';
import { useOnboarding } from '@/lib/OnboardingContext';
import OnboardingSuccessModal from './OnboardingSuccessModal';

type OnboardingStep = 1 | 2 | 3 | 4;
type IconName = 'Package' | 'MapPin' | 'Home' | 'FileText';

interface OnboardingFooterProps {
  step: OnboardingStep;
  count?: number;
  statusText?: string;
  iconName: IconName;
  infoText: string;
  buttonLabel: string;
}

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
  const { currentStep, completeStep, isModalOpen, isDemo } = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();
  const Icon = iconMap[iconName];

  // Only render if this is the active step
  // EXCEPTION: For Step 4, if we are showing the success modal, keep rendering (but hidden via z-index maybe? No, modal is fixed z-50).
  // If we transition step to 5 immediately, this component unmounts.
  // So for Step 4, we delay calling completeStep until the modal is closed.
  if (currentStep !== step) {
    return null;
  }

  const handleComplete = async () => {
    setIsCompleting(true);

    if (step === 4) {
      // For the final step, show success modal first
      setShowSuccessModal(true);
      setIsCompleting(false);
      return;
    }

    // For other steps, just proceed
    // Small delay to show spinner/feedback
    setTimeout(() => {
        completeStep(step);

        // Navigation logic for next step is handled by OnboardingWizard (State A) which will pop up
        // because we are on the wrong page for the NEXT step.
        // E.g. Finish Step 1 (Warehouse) -> Step 2 (Apiaries).
        // User is still on Warehouse. OnboardingWizard sees Step 2 + Warehouse path -> Shows Modal "Go to Apiaries".
        // This is perfect behavior.

        router.refresh();
    }, 500);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    completeStep(4); // Finish the wizard
    router.refresh();
  };

  // Determine visibility class based on isModalOpen
  // If modal is open, slide down.
  const transformClass = isModalOpen ? 'translate-y-[120%]' : 'translate-y-0';

  return (
    <>
      <div
        className={`fixed bottom-0 left-0 right-0 md:left-[288px] z-[9997] bg-amber-500 border-t-2 border-amber-600 shadow-2xl transition-transform duration-300 ease-in-out ${transformClass}`}
        style={{
            willChange: 'transform'
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
      </div>

      {/* Modal Sukcesu - tylko dla kroku 4 */}
      {step === 4 && (
        <OnboardingSuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessModalClose}
        />
      )}
    </>
  );
}

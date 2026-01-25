'use client';

import { X, CheckCircle2 } from 'lucide-react';

interface OnboardingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingSuccessModal({ isOpen, onClose }: OnboardingSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Modal */}
      <div
        className="fixed z-[9999] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border-2 border-green-500 p-8 max-w-md w-full mx-4"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          position: 'fixed',
        }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>

          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Twoja Pasieka jest Gotowa!
          </h2>

          {/* Message */}
          <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
            Świetna robota. Wszystkie kluczowe moduły zostały skonfigurowane. Możesz teraz rozpocząć pracę, planować przeglądy i cieszyć się pszczelarstwem w wersji cyfrowej. Powodzenia!
          </p>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-8 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Zaczynamy pracę
          </button>
        </div>
      </div>
    </>
  );
}

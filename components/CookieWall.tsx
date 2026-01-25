'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function CookieWall() {
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Sprawdź czy użytkownik już wyraził zgodę
    const cookiesAccepted = localStorage.getItem('cookies_accepted');
    if (!cookiesAccepted) {
      setShowModal(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShowModal(false);
  };

  const handleReject = () => {
    // Przekierowanie poza stronę
    window.location.href = 'https://www.google.pl';
  };

  // Nie renderuj niczego przed zamontowaniem (aby uniknąć hydration mismatch)
  if (!mounted) {
    return null;
  }

  if (!showModal) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ zIndex: 99999 }}
    >
      {/* Backdrop - zablokowane tło */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-8 border-2 border-amber-500">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Zgoda na pliki cookies
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Zgodnie z polskim Prawem Telekomunikacyjnym, wymagana jest zgoda na przechowywanie 
              plików cookies w celu prawidłowego działania systemu ApiaryMind.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
              Pliki cookies są niezbędne do funkcjonowania aplikacji, w tym do zarządzania sesją 
              użytkownika i zapisywania preferencji.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handleAccept}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            AKCEPTUJĘ
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            NIE WYRAŻAM ZGODY
          </button>
        </div>
      </div>
    </div>
  );
}

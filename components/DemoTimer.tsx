"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";

interface DemoTimerProps {
  userId: string;
  createdAt: string;
}

export default function DemoTimer({ userId, createdAt }: DemoTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const created = new Date(createdAt);
      const expirationTime = new Date(created.getTime() + 2 * 60 * 60 * 1000); // +2 hours
      const now = new Date();
      const diff = expirationTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("00:00:00");
        if (!showExpiredModal) {
          setShowExpiredModal(true);
          // Auto sign out after showing modal
          setTimeout(() => {
            handleSignOut();
          }, 5000); // 5 seconds delay to show modal
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatTime = (num: number) => String(num).padStart(2, "0");
      setTimeRemaining(`${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`);
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [createdAt, showExpiredModal, handleSignOut]);

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-bold text-amber-400">
          Czas sesji DEMO: {timeRemaining}
        </span>
      </div>

      {showExpiredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-500/30 shadow-2xl p-6 max-w-md mx-4 relative">
            <button
              onClick={handleSignOut}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Czas testowy minął
                </h3>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Twój czas testowy minął. Dane zostały zresetowane. Załóż pełne konto, aby zapisać postępy.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
              >
                Przejdź do rejestracji
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

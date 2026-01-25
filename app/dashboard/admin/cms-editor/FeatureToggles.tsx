'use client'

import { useState, useEffect } from 'react';
import { toggleBetaBanner, isBetaBannerEnabled } from '@/app/actions/cms-features';
import { Power, Check, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FeatureToggles() {
  const router = useRouter();
  const [betaBannerEnabled, setBetaBannerEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const enabled = await isBetaBannerEnabled();
      setBetaBannerEnabled(enabled);
    } catch (err: any) {
      setError(err.message || 'Błąd ładowania ustawień');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBetaBanner = async () => {
    setSaving(true);
    setError(null);
    const newValue = !betaBannerEnabled;
    
    const result = await toggleBetaBanner(newValue);
    setSaving(false);

    if (result.success) {
      setBetaBannerEnabled(newValue);
      router.refresh();
    } else {
      setError(result.error || 'Błąd zapisywania');
    }
  };

  return (
    <div className="space-y-4">
      {/* Beta Banner Toggle */}
      <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-5 border border-white/10 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Power className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-950 dark:text-white">
                  Banner Promocyjny Beta
                </h3>
                <p className="text-sm text-amber-900/70 dark:text-gray-400 mt-1">
                  Wyświetlaj lub ukryj banner promocyjny programu Beta na stronie głównej
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleBetaBanner}
            disabled={loading || saving}
            className={`relative w-14 h-8 rounded-full transition-colors flex items-center px-1 ${
              betaBannerEnabled
                ? 'bg-green-500'
                : 'bg-gray-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div
              className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${
                betaBannerEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm">
          {betaBannerEnabled ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Banner jest wyświetlany</span>
            </>
          ) : (
            <>
              <X className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 font-medium">Banner jest ukryty</span>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}










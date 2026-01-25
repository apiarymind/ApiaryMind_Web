'use client';

import { useState } from 'react';
import { PlusCircle, MapPin } from 'lucide-react';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { AddApiaryModal } from './AddApiaryModal';
import { ApiaryCard } from './ApiaryCard';
import { useRouter } from 'next/navigation';
import OnboardingFooter from '@/app/components/onboarding/OnboardingFooter';

interface ApiariesListClientProps {
  apiaries: Array<{
    id: string;
    name: string;
    location: string | null;
    type: string | null;
    hives?: { count: number }[];
  }>;
  statusMap: Map<string, { hasQuarantine: boolean; tasksToday: number }>;
  error: string | null;
}

export function ApiariesListClient({ apiaries, statusMap, error }: ApiariesListClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header z przyciskiem dodawania */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-primary">Twoje Pasieki</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-amber-400 font-semibold transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Dodaj Pasiekę</span>
        </button>
      </div>

      {/* Modal dodawania */}
      <AddApiaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Błąd pobierania danych: {error}
        </div>
      )}

      {!error && apiaries.length === 0 ? (
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center">
           <div className="text-4xl mb-4">🍯</div>
           <h3 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-2">Nie znaleziono pasiek</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60 mb-4">
             Dodaj pierwszą pasiekę, aby rozpocząć zarządzanie.
           </p>
           <button
             onClick={() => setIsModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-amber-400 font-semibold transition-colors"
           >
             <PlusCircle className="w-5 h-5" />
             <span>Dodaj Pasiekę</span>
           </button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiaries.map((apiary) => {
            const hivesCount = apiary.hives?.[0]?.count || 0;
            const status = statusMap.get(apiary.id) || {
              hasQuarantine: false,
              tasksToday: 0,
            };
            return (
              <ApiaryCard
                key={apiary.id}
                apiary={apiary}
                hivesCount={hivesCount}
                status={status}
              />
            );
          })}
        </div>
      )}

      {/* Onboarding Footer - Krok 2 */}
      <OnboardingFooter
        step={2}
        count={apiaries.length}
        iconName="MapPin"
        infoText="Lokalizacja to podstawa. Pamiętaj, aby dodać współrzędne GPS – dzięki temu włączysz moduł Pogody i mapy pożytków."
        buttonLabel="Pasieki gotowe, stawiamy Ule >>"
      />
    </div>
  );
}


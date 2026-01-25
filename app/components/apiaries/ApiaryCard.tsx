'use client';

import { Trash2, Truck, Home } from 'lucide-react';
import Link from 'next/link';
import { deleteApiary } from '@/app/actions/apiary-crud';
import { ApiaryStatusBar } from './ApiaryStatusBar';
import { ApiaryLocation } from './ApiaryLocation';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApiaryCardProps {
  apiary: {
    id: string;
    name: string;
    location: string | null;
    type: string | null;
  };
  hivesCount: number;
  status: {
    hasQuarantine: boolean;
    tasksToday: number;
  };
}

export function ApiaryCard({ apiary, hivesCount, status }: ApiaryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!window.confirm(`Czy na pewno chcesz usunąć pasiekę "${apiary.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteApiary(apiary.id);

    if (result.success) {
      router.refresh();
    } else {
      alert(`Błąd: ${result.error || 'Nie udało się usunąć pasieki'}`);
      setIsDeleting(false);
    }
  };

  // Określ typ pasieki (normalizuj do lowercase dla porównania)
  const apiaryType = apiary.type?.toLowerCase() || 'stationary';
  const isMigratory = apiaryType === 'migratory';
  
  // Konfiguracja badge'a typu
  const typeConfig = isMigratory
    ? {
        text: 'Wędrowna',
        icon: <Truck className="w-3 h-3" />,
        className: 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-amber-700 dark:text-amber-400',
      }
    : {
        text: 'Stacjonarna',
        icon: <Home className="w-3 h-3" />,
        className: 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/10 text-blue-700 dark:text-blue-400',
      };

  return (
    <GlassCard className="p-6 flex flex-col h-full hover:scale-[1.02] transition-transform relative group">
      {/* Przycisk usuwania */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        title="Usuń pasiekę"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="flex justify-between items-start mb-4 pr-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 truncate pr-2" title={apiary.name}>
            {apiary.name}
          </h2>
          {/* Badge typu pasieki */}
          <div className={`flex items-center gap-1 mt-1.5 w-fit px-2 py-0.5 rounded-full border text-xs font-semibold ${typeConfig.className}`}>
            {typeConfig.icon}
            <span>{typeConfig.text}</span>
          </div>
        </div>
        <div className="text-xs font-bold bg-white dark:bg-white/5 text-gray-900 dark:text-amber-400 px-2 py-1 rounded-full whitespace-nowrap border border-gray-300 dark:border-white/10">
          {hivesCount} {hivesCount === 1 ? 'Ul' : 'Uli'}
        </div>
      </div>
      
      <div className="flex-grow space-y-2 mb-4">
        <ApiaryLocation locationGeo={apiary.location} />
      </div>

      {/* Pasek Statusu */}
      <ApiaryStatusBar
        apiaryId={apiary.id}
        locationGeo={apiary.location}
        hasQuarantine={status.hasQuarantine}
        tasksToday={status.tasksToday}
        hivesCount={hivesCount}
      />

      <div className="mt-auto pt-4 border-t border-gray-300 dark:border-glass-dark">
        <Link 
          href={`/dashboard/apiaries/${apiary.id}/operational`}
          className="block w-full text-center bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-amber-400 font-bold py-2 rounded transition-colors text-sm uppercase border border-gray-300 dark:border-white/10 shadow-sm dark:shadow-none"
        >
          Sprawdź szczegóły
        </Link>
      </div>
    </GlassCard>
  );
}


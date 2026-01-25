import { Suspense } from 'react';
import { getHarvestHistory } from '@/app/actions/get-harvest-history';
import { getUserApiaries } from '@/app/actions/get-apiaries';
import HarvestTable from './HarvestTable';
import HarvestFilters from './HarvestFilters';
import { Droplet, Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Historia Miodobrań | ApiaryMind',
  description: 'Przeglądaj historię miodobrań, statystyki i szczegóły zebranych plonów.',
};

export default async function HarvestsPage({
  searchParams,
}: {
  searchParams: { year?: string; apiary?: string; type?: string };
}) {
  const currentYear = new Date().getFullYear();
  const selectedYear = searchParams.year ? parseInt(searchParams.year) : currentYear;
  const selectedApiaryId = searchParams.apiary || 'ALL';
  const selectedHoneyType = searchParams.type || 'ALL';

  const { data: harvests, error } = await getHarvestHistory({
    year: selectedYear,
    apiaryId: selectedApiaryId === 'ALL' ? undefined : selectedApiaryId,
    honeyType: selectedHoneyType === 'ALL' ? undefined : selectedHoneyType,
  });

  const { data: apiaries } = await getUserApiaries();

  // Extract unique honey types from harvests
  const honeyTypes = Array.from(
    new Set(harvests.map(h => h.honey_type).filter(Boolean))
  ).sort();

  // Calculate summary stats
  const totalKg = harvests.reduce((sum, h) => sum + h.total_kg, 0);
  const uniqueHives = new Set(harvests.map(h => h.hive?.id).filter(Boolean));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Droplet className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Historia Miodobrań</h1>
            <p className="text-amber-200/70">
              Zarządzaj rekordami miodobrań i przeglądaj statystyki
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-amber-200/70">Łącznie zebrany miód ({selectedYear})</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            {totalKg.toFixed(1)} <span className="text-lg">kg</span>
          </p>
        </div>
        <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-amber-200/70">Liczba miodobrań</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{harvests.length}</p>
        </div>
        <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4">
          <p className="text-sm text-amber-200/70">Średnia na ul</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">
            {uniqueHives.size > 0 ? (totalKg / uniqueHives.size).toFixed(1) : 0}{' '}
            <span className="text-lg">kg</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <HarvestFilters
        currentYear={currentYear}
        selectedYear={selectedYear}
        selectedApiaryId={selectedApiaryId}
        selectedHoneyType={selectedHoneyType}
        apiaries={apiaries}
        honeyTypes={honeyTypes}
      />

      {/* Harvest Table */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
          </div>
        }
      >
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
          </div>
        ) : harvests.length === 0 ? (
          <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-12 text-center">
            <Droplet className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
            <p className="text-amber-200/70 text-lg">
              Brak miodobrań {selectedYear !== currentYear ? `w ${selectedYear} roku` : 'w tym roku'}
            </p>
            <p className="text-amber-200/50 text-sm mt-2">
              Dodaj pierwsze miodobranie z widoku listy uli
            </p>
          </div>
        ) : (
          <HarvestTable harvests={harvests} />
        )}
      </Suspense>
    </div>
  );
}

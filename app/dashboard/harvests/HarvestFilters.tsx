'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface HarvestFiltersProps {
  currentYear: number;
  selectedYear: number;
  selectedApiaryId: string;
  selectedHoneyType: string;
  apiaries: Array<{ id: string; name: string }>;
  honeyTypes: string[];
}

export default function HarvestFilters({
  currentYear,
  selectedYear,
  selectedApiaryId,
  selectedHoneyType,
  apiaries,
  honeyTypes,
}: HarvestFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'ALL' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/dashboard/harvests?${params.toString()}`);
  };

  return (
    <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-amber-200 mb-3">Filtry</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Year Filter */}
        <div>
          <label className="block text-xs text-amber-200/70 mb-2">Rok</label>
          <select
            name="year"
            value={selectedYear}
            onChange={(e) => handleFilterChange('year', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white text-sm"
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Apiary Filter */}
        <div>
          <label className="block text-xs text-amber-200/70 mb-2">Pasieka</label>
          <select
            name="apiary"
            value={selectedApiaryId}
            onChange={(e) => handleFilterChange('apiary', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white text-sm"
          >
            <option value="ALL">Wszystkie pasieki</option>
            {apiaries.map(apiary => (
              <option key={apiary.id} value={apiary.id}>
                {apiary.name}
              </option>
            ))}
          </select>
        </div>

        {/* Honey Type Filter */}
        <div>
          <label className="block text-xs text-amber-200/70 mb-2">Rodzaj miodu</label>
          <select
            name="type"
            value={selectedHoneyType}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 border border-amber-500/30 rounded-lg text-white text-sm"
          >
            <option value="ALL">Wszystkie rodzaje</option>
            {honeyTypes.map(type => (
              <option key={type} value={type || ''}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

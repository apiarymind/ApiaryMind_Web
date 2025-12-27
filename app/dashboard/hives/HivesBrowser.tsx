'use client';

import { useState, useMemo } from 'react';
import { Hive } from '@/app/actions/get-hives';
import { GlassCard } from '@/app/components/ui/GlassCard';
import Link from 'next/link';

interface HivesBrowserProps {
  initialHives: Hive[];
}

export default function HivesBrowser({ initialHives }: HivesBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('ALL');
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  // Extract unique filter options
  const apiaries = useMemo(() => {
    const map = new Map();
    initialHives.forEach(h => {
      if (h.apiary) {
        map.set(h.apiary.id, h.apiary.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [initialHives]);

  const hiveTypes = useMemo(() => {
    const types = new Set(initialHives.map(h => h.type).filter(Boolean));
    return Array.from(types).sort();
  }, [initialHives]);

  // Handle Type Toggle
  const toggleType = (type: string) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    setSelectedTypes(next);
  };

  // Filter & Sort & Group Logic
  const groupedHives = useMemo(() => {
    // 1. Filter
    const filtered = initialHives.filter(hive => {
      const matchesSearch = hive.hive_number.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesApiary = selectedApiaryId === 'ALL' || hive.apiary_id === selectedApiaryId;
      const matchesType = selectedTypes.size === 0 || (hive.type && selectedTypes.has(hive.type));

      return matchesSearch && matchesApiary && matchesType;
    });

    // 2. Group by Apiary
    const groups: Record<string, Hive[]> = {};
    filtered.forEach(hive => {
      const apiaryName = hive.apiary ? hive.apiary.name : 'Bez Pasieki';
      if (!groups[apiaryName]) {
        groups[apiaryName] = [];
      }
      groups[apiaryName].push(hive);
    });

    // 3. Sort Keys (Apiary Names) & Sort Values (Hives Natural Sort)
    const sortedGroupKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));

    const sortedGroups = sortedGroupKeys.map(key => {
      const hives = groups[key].sort((a, b) =>
        a.hive_number.localeCompare(b.hive_number, undefined, { numeric: true, sensitivity: 'base' })
      );
      return { apiaryName: key, hives };
    });

    return sortedGroups;
  }, [initialHives, searchQuery, selectedApiaryId, selectedTypes]);

  const totalFilteredCount = groupedHives.reduce((acc, g) => acc + g.hives.length, 0);

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center shadow-sm">

        {/* Search */}
        <div className="w-full lg:w-1/3 relative">
          <input
            type="text"
            placeholder="Szukaj numeru ula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-700 text-white placeholder-neutral-500 rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          {/* Apiary Select */}
          <select
            value={selectedApiaryId}
            onChange={(e) => setSelectedApiaryId(e.target.value)}
            className="bg-neutral-950 border border-neutral-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-yellow-500"
          >
            <option value="ALL">Wszystkie Pasieki</option>
            {apiaries.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {/* Hive Types */}
          <div className="flex flex-wrap gap-2 items-center">
             {hiveTypes.map(type => (
               <button
                 key={type}
                 onClick={() => toggleType(type)}
                 className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all border ${
                   selectedTypes.has(type)
                     ? 'bg-yellow-500 text-black border-yellow-500'
                     : 'bg-transparent text-neutral-400 border-neutral-700 hover:border-neutral-500'
                 }`}
               >
                 {type}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {totalFilteredCount === 0 ? (
        <div className="bg-neutral-900/30 border border-neutral-800 p-12 rounded-xl text-center">
           <div className="text-4xl mb-4">🔍</div>
           <h3 className="text-xl font-bold text-white mb-2">Brak wyników</h3>
           <p className="text-neutral-400">Zmień kryteria wyszukiwania lub filtry.</p>
        </div>
      ) : (
        <div className="space-y-12">
           {groupedHives.map((group) => (
             <div key={group.apiaryName}>
                <h2 className="text-xl font-bold text-yellow-500 mb-4 border-b border-neutral-800 pb-2 flex justify-between items-end">
                  {group.apiaryName}
                  <span className="text-xs text-neutral-500 font-normal mb-1">{group.hives.length} uli</span>
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {group.hives.map(hive => (
                    <Link href={`/dashboard/apiaries/${hive.apiary_id}/hive/${hive.id}`} key={hive.id}>
                      <div className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-yellow-500/50 rounded-lg p-4 transition-all duration-200 group cursor-pointer h-full relative overflow-hidden">

                        {/* Status/Color Accent Strip (Optional visual flair) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex flex-col items-center text-center">
                           <span className="text-3xl mb-2 filter grayscale group-hover:grayscale-0 transition-all duration-300">🐝</span>

                           <h3 className="text-2xl font-bold text-white group-hover:text-yellow-400 font-heading mb-1">
                             {hive.hive_number}
                           </h3>

                           {hive.type && (
                             <span className="text-xs text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 mt-1">
                               {hive.type}
                             </span>
                           )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}

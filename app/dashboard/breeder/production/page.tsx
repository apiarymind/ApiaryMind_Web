'use client';

import React, { useState } from 'react';
import { BreedingBatch } from '@/types/supabase';
import { 
  Plus, 
  Calendar, 
  Dna, 
  Egg, 
  CheckCircle2, 
  XCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react';

const MOCK_BATCHES: BreedingBatch[] = [
  {
    id: '1',
    batch_number: 'S/2025/01',
    lineage: 'Buckfast KB',
    start_date: '2025-05-01',
    estimated_hatching_date: '2025-05-13',
    breeder_id: 'u1',
    status: 'IN_PROGRESS',
    created_at: '2024-12-01'
  },
  {
    id: '2',
    batch_number: 'S/2025/02',
    lineage: 'Carnica Sklenar',
    start_date: '2025-05-10',
    estimated_hatching_date: '2025-05-22',
    breeder_id: 'u1',
    status: 'PLANNED',
    created_at: '2024-12-05'
  },
  {
    id: '3',
    batch_number: 'S/2025/03',
    lineage: 'Caucasica',
    start_date: '2025-04-20',
    estimated_hatching_date: '2025-05-02',
    breeder_id: 'u1',
    status: 'COMPLETED',
    created_at: '2024-12-05'
  }
];

export default function BreedingProductionPage() {
  const [batches, setBatches] = useState<BreedingBatch[]>(MOCK_BATCHES);

  // Status mapping for badges
  const getStatusColor = (status: BreedingBatch['status']) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'SEALED': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'HATCHED': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'COMPLETED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: BreedingBatch['status']) => {
    switch (status) {
        case 'PLANNED': return 'Zaplanowana';
        case 'IN_PROGRESS': return 'W toku';
        case 'SEALED': return 'Zasklepione';
        case 'HATCHED': return 'Wygryzione';
        case 'COMPLETED': return 'Zakończona';
        case 'CANCELLED': return 'Anulowana';
        default: return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
               <Dna className="w-8 h-8 text-yellow-500" />
               Serie Mateczne
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
               Zarządzaj cyklem wychowu matek pszczelich.
            </p>
          </div>
          
          <button className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-105">
             <Plus className="w-5 h-5" />
             Nowa Seria
          </button>
       </div>

       {/* Kanban/Grid Board */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {batches.map((batch) => (
             <div key={batch.id} className="group backdrop-blur-md bg-white/70 dark:bg-black/40 rounded-xl border border-white/20 dark:border-white/10 shadow-lg hover:shadow-xl transition-all flex flex-col overflow-hidden">
                {/* Status Bar */}
                <div className={`h-1.5 w-full ${getStatusColor(batch.status).split(' ')[0].replace('/30', '')}`}></div>
                
                <div className="p-5 flex-1 flex flex-col gap-4">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {batch.batch_number}
                         </h3>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold mt-1 ${getStatusColor(batch.status)}`}>
                            {getStatusLabel(batch.status)}
                         </span>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                         <MoreHorizontal className="w-5 h-5" />
                      </button>
                   </div>
                   
                   <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                         <Dna className="w-4 h-4 text-purple-500" />
                         <span className="font-medium">Linia:</span>
                         <span>{batch.lineage}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                         <Calendar className="w-4 h-4 text-blue-500" />
                         <span className="font-medium">Start:</span>
                         <span>{batch.start_date}</span>
                      </div>

                      {batch.estimated_hatching_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Egg className="w-4 h-4 text-yellow-500" />
                            <span className="font-medium">Wygryzanie:</span>
                            <span className="text-gray-900 dark:text-white font-bold">{batch.estimated_hatching_date}</span>
                        </div>
                      )}
                   </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center text-xs text-gray-500">
                   <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> 
                      Aktualizacja 2 dni temu
                   </span>
                </div>
             </div>
          ))}
          
          {/* Add New Placeholder Card */}
          <button className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all min-h-[200px]">
             <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
             </div>
             <span className="font-bold">Dodaj nową serię</span>
          </button>
       </div>
    </div>
  );
}

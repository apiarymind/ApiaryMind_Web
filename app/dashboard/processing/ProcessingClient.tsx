'use client';

import { useState } from 'react';
import { RawHoneyItem } from '@/app/actions/get-raw-honey';
import { processHoney, JarSize } from '@/app/actions/process-honey';
import HoneyProcessingModal from './HoneyProcessingModal';
import { Package, Droplet, Calendar, Hash, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProcessingClientProps {
  initialRawHoney: RawHoneyItem[];
}

export default function ProcessingClient({ initialRawHoney }: ProcessingClientProps) {
  const router = useRouter();
  const [rawHoney, setRawHoney] = useState(initialRawHoney);
  const [selectedItem, setSelectedItem] = useState<RawHoneyItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProcess = (item: RawHoneyItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleProcessingComplete = async () => {
    // Refresh data
    router.refresh();
    handleModalClose();
  };

  if (rawHoney.length === 0) {
    return (
      <div className="bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-12 text-center shadow-lg dark:shadow-none">
        <Droplet className="w-16 h-16 text-gray-400 dark:text-amber-400/50 mx-auto mb-4" />
        <p className="text-gray-800 dark:text-amber-200/70 text-lg">Brak surowego miodu do przetworzenia</p>
        <p className="text-gray-600 dark:text-amber-200/50 text-sm mt-2">
          Dodaj miodobranie, aby pojawił się tutaj surowy miód gotowy do rozlewu
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg overflow-hidden shadow-lg dark:shadow-none">
        <div className="p-4 border-b border-gray-300 dark:border-white/10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Dostępny surowy miód</h2>
          <p className="text-sm text-gray-700 dark:text-amber-200/70 mt-1">
            Wybierz partię do przetworzenia (wirowanie i rozlew na słoiki)
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-white/5">
          {rawHoney.map(item => (
            <div
              key={item.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30">
                      <Droplet className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-semibold">{item.item_name}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-700 dark:text-amber-200/70">
                        {item.batch_number && (
                          <div className="flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            <span className="font-mono">{item.batch_number}</span>
                          </div>
                        )}
                        {item.honey_type && (
                          <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-xs">
                            {item.honey_type}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(item.created_at).toLocaleDateString('pl-PL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {item.quantity.toFixed(1)} <span className="text-lg">kg</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-amber-200/50 mt-1">Dostępne</p>
                  </div>

                  <button
                    onClick={() => handleProcess(item)}
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Przetwórz
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedItem && (
        <HoneyProcessingModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          rawHoneyItem={selectedItem}
          onComplete={handleProcessingComplete}
        />
      )}
    </>
  );
}

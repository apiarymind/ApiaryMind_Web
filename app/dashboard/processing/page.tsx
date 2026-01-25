import { Suspense } from 'react';
import { getRawHoney } from '@/app/actions/get-raw-honey';
import ProcessingClient from './ProcessingClient';
import { Loader2, Droplet, Package } from 'lucide-react';

export const metadata = {
  title: 'Przetwarzanie Miodu | ApiaryMind',
  description: 'Wirowanie i rozlew miodu na słoiki.',
};

export default async function ProcessingPage() {
  const { data: rawHoney, error } = await getRawHoney();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/30">
            <Package className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Przetwarzanie Miodu</h1>
            <p className="text-gray-700 dark:text-amber-200/70">
              Wirowanie i rozlew miodu na słoiki
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      {rawHoney && rawHoney.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-lg p-4 shadow-md dark:shadow-none">
            <p className="text-sm text-gray-700 dark:text-amber-200/70">Dostępny surowy miód</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {rawHoney.reduce((sum, item) => sum + item.quantity, 0).toFixed(1)}{' '}
              <span className="text-lg">kg</span>
            </p>
          </div>
          <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-amber-200/70">Liczba partii</p>
            <p className="text-3xl font-bold text-amber-400 mt-1">{rawHoney.length}</p>
          </div>
          <div className="bg-white/5 dark:bg-black/20 border border-white/10 rounded-lg p-4">
            <p className="text-sm text-amber-200/70">Gotowe do przetworzenia</p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              {rawHoney.filter(item => item.quantity > 0).length}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
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
        ) : (
          <ProcessingClient initialRawHoney={rawHoney || []} />
        )}
      </Suspense>
    </div>
  );
}

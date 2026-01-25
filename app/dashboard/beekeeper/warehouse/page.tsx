import { getWarehouseData } from '@/app/actions/get-warehouse-data';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import AddStockModal from '@/app/components/warehouse/AddStockModal';
import WarehouseClient from './WarehouseClient';
import OnboardingFooter from '@/app/components/onboarding/OnboardingFooter';

export default async function WarehousePage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data, error } = await getWarehouseData();

  if (error) {
    console.error("Warehouse data fetch error:", error);
  }

  const inventory = data?.inventory || [];
  const products = data?.products || [];
  
  const isWarehouseEmpty = inventory.length === 0 && products.length === 0;

  return (
    <div className="space-y-8">
      {/* HEADER + DESKTOP BUTTON */}
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-heading font-bold text-primary">Magazyn</h1>
         <AddStockModal />
      </div>

      <div className="glass-panel p-4 border-l-4 border-primary rounded-xl">
         <p className="text-sm">
            Stan magazynowy pasieki. Pamiętaj: Ule z pszczołami znajdują się w zakładce <b>Pasieki</b>. 
            Tutaj widzisz tylko wolny sprzęt i gotowe produkty.
         </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Wystąpił błąd: {error}
        </div>
      )}

      {isWarehouseEmpty && !error ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
           <div className="text-6xl mb-6 opacity-50">📦</div>
           <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pusty magazyn</h3>
           <p className="text-gray-700 dark:text-white/60 max-w-md">
             Brak danych do wyświetlenia.
           </p>
        </div>
      ) : (
        <WarehouseClient inventory={inventory} products={products} />
      )}

      {/* Onboarding Footer - Krok 1 */}
      <OnboardingFooter
        step={1}
        count={inventory.length + products.length}
        iconName="Package"
        infoText="Skompletuj pełny zestaw!\nUl stojak wymaga dennicy i korpusu, leżak tylko wyboru typu."
        buttonLabel="Mam już wszystko, przejdź do Pasieki >>"
      />
    </div>
  );
};

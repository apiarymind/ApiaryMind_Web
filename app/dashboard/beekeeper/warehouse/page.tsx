import { getWarehouseData } from '@/app/actions/get-warehouse-data';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Package, Archive, Layers } from 'lucide-react';
import AddStockModal from '@/app/components/warehouse/AddStockModal';

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
  const storedHives = data?.storedHives || [];
  
  const isWarehouseEmpty = inventory.length === 0 && products.length === 0 && storedHives.length === 0;

  return (
    <div className="space-y-8">
      {/* HEADER + DESKTOP BUTTON */}
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-heading font-bold text-primary">Magazyn</h1>
         
         <AddStockModal />
      </div>

      <GlassCard className="p-4 border-l-4 border-primary">
         <p className="text-sm text-text-dark/80 dark:text-amber-100/80">
            Stan magazynowy pasieki. Pamiętaj: Ule z pszczołami znajdują się w zakładce <b>Pasieki</b>. 
            Tutaj widzisz tylko wolny sprzęt i gotowe produkty.
         </p>
      </GlassCard>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Wystąpił błąd: {error}
        </div>
      )}

      {isWarehouseEmpty && !error ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
           <div className="text-6xl mb-6 opacity-50">📦</div>
           <h3 className="text-2xl font-bold text-text-dark dark:text-amber-100 mb-2">Pusty magazyn</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60 max-w-md">
             Brak danych do wyświetlenia.
           </p>
        </GlassCard>
      ) : (
        <div className="space-y-12">
          
          {/* SECTION 1: PRODUCTS (HONEY) */}
          <section>
            <div className="flex items-center gap-2 mb-6">
               <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Package className="w-6 h-6 text-amber-500" />
               </div>
               <h2 className="text-2xl font-bold text-text-dark dark:text-amber-50">Produkty Gotowe</h2>
            </div>
             {products.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((product) => (
                     <GlassCard key={product.id} className="p-5 flex flex-col justify-between h-full hover:border-primary/50 transition-colors group">
                        <div>
                           <div className="flex justify-between items-start">
                              <h3 className="font-bold text-xl text-text-dark dark:text-amber-100 mb-1 group-hover:text-primary transition-colors">
                                 {product.name}
                              </h3>
                              {product.price && (
                                 <span className="bg-green-500/20 text-green-400 font-mono font-bold px-2 py-1 rounded text-sm">
                                    {product.price} PLN
                                 </span>
                              )}
                           </div>
                           <div className="flex gap-2 mb-4 mt-2">
                              <span className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 text-text-dark/60 dark:text-amber-200/60 uppercase tracking-wider">
                                 {product.type}
                              </span>
                           </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-dashed border-white/10 flex justify-between items-end">
                           <div className="flex flex-col">
                              <span className="text-xs text-text-dark/50 dark:text-amber-200/50 uppercase font-bold">Stan magazynowy</span>
                              <span className="font-heading font-bold text-2xl text-primary">
                                 {product.quantity} <span className="text-sm font-normal text-text-dark/60 dark:text-amber-200/60">{product.unit}</span>
                              </span>
                           </div>
                        </div>
                     </GlassCard>
                  ))}
               </div>
             ) : (
                <p className="opacity-50 italic pl-2">Brak produktów.</p>
             )}
          </section>

          {/* SECTION 2: INVENTORY (EQUIPMENT) */}
          <section>
            <div className="flex items-center gap-2 mb-6">
               <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Layers className="w-6 h-6 text-blue-400" />
               </div>
               <h2 className="text-2xl font-bold text-text-dark dark:text-amber-50">Sprzęt Pszczelarski</h2>
            </div>
            {inventory.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {inventory.map((item) => (
                     <GlassCard key={item.id} className="p-4 flex flex-col justify-between hover:bg-white/5 transition-colors">
                        <div>
                           <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 mb-1 block">
                              {item.category}
                           </span>
                           <h3 className="font-bold text-lg text-text-dark dark:text-gray-200 leading-tight">
                              {item.name}
                           </h3>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                           <div className="h-1 flex-grow bg-white/10 rounded-full mr-4 overflow-hidden">
                              <div className="h-full bg-blue-500/50" style={{ width: '50%' }}></div> 
                           </div>
                           <span className="font-mono font-bold text-xl text-text-dark dark:text-white">
                              {item.quantity}
                           </span>
                        </div>
                     </GlassCard>
                  ))}
               </div>
            ) : (
               <p className="opacity-50 italic pl-2">Brak sprzętu.</p>
            )}
          </section>

          {/* SECTION 3: STORED HIVES */}
          {storedHives.length > 0 && (
             <section>
                <div className="flex items-center gap-2 mb-4 mt-8 opacity-70 hover:opacity-100 transition-opacity">
                   <Archive className="w-5 h-5" />
                   <h2 className="text-lg font-bold">Wolne Ule</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-6 gap-3">
                   {storedHives.map((hive) => (
                      <div key={hive.id} className="bg-black/20 border border-white/5 rounded-lg p-3 text-center">
                         <div className="text-2xl mb-1 grayscale">🐝</div>
                         <div className="font-bold text-sm">#{hive.hive_number}</div>
                         <div className="text-[10px] opacity-50">{hive.type}</div>
                      </div>
                   ))}
                </div>
             </section>
          )}
        </div>
      )}
    </div>
  );
};

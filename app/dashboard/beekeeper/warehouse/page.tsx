import { getWarehouseData } from '@/app/actions/get-warehouse-data';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { Package, Archive, Layers } from 'lucide-react';

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
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-heading font-bold text-primary">Magazyn</h1>
      </div>

      <GlassCard className="p-4">
         <p className="text-sm text-text-dark/60 dark:text-amber-200/60">
            Zarządzaj sprzętem pasiecznym, produktami gotowymi oraz nieużywanymi ulami.
         </p>
      </GlassCard>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Wystąpił błąd podczas pobierania danych: {error}
        </div>
      )}

      {isWarehouseEmpty && !error ? (
        <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
           <div className="text-6xl mb-6 opacity-50">📦</div>
           <h3 className="text-2xl font-bold text-text-dark dark:text-amber-100 mb-2">Pusty magazyn</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60 max-w-md">
             Twój magazyn jest obecnie pusty. Dodaj sprzęt lub produkty, aby zobaczyć je tutaj.
           </p>
        </GlassCard>
      ) : (
        <div className="space-y-10">

          {/* Section A: Equipment (Inventory) */}
          <section>
            <div className="flex items-center gap-2 mb-4">
               <Layers className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-bold text-text-dark dark:text-amber-50">Sprzęt (Inwentarz)</h2>
            </div>
            {inventory.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventory.map((item) => (
                     <GlassCard key={item.id} className="p-4 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform">
                        <div>
                           <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg text-text-dark dark:text-amber-100">{item.name}</h3>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-black/5 dark:bg-white/10 text-text-dark/70 dark:text-amber-200/70">
                                 {item.category}
                              </span>
                           </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/10 flex justify-between items-center">
                           <span className="text-sm text-text-dark/60 dark:text-amber-200/60">Ilość:</span>
                           <span className="font-bold text-xl text-primary">{item.quantity} <span className="text-xs text-text-dark/50 dark:text-amber-200/50">{item.unit}</span></span>
                        </div>
                     </GlassCard>
                  ))}
               </div>
            ) : (
               <p className="text-sm text-text-dark/40 dark:text-amber-200/40 italic pl-2">Brak sprzętu w magazynie.</p>
            )}
          </section>

          {/* Section B: Products */}
          <section>
            <div className="flex items-center gap-2 mb-4">
               <Package className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-bold text-text-dark dark:text-amber-50">Produkty Gotowe</h2>
            </div>
             {products.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                     <GlassCard key={product.id} className="p-4 flex flex-col justify-between h-full hover:scale-[1.01] transition-transform border-l-4 border-l-primary">
                        <div>
                           <h3 className="font-bold text-lg text-text-dark dark:text-amber-100 mb-1">{product.name}</h3>
                           {product.batch_number && (
                              <div className="text-xs text-text-dark/50 dark:text-amber-200/50 mb-3 font-mono">
                                 Partia: {product.batch_number}
                              </div>
                           )}
                           <div className="flex gap-2 mb-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                 {product.type}
                              </span>
                           </div>
                        </div>
                        <div className="mt-2 flex justify-between items-end">
                           <div className="flex flex-col">
                              <span className="text-xs text-text-dark/50 dark:text-amber-200/50">Ilość:</span>
                              <span className="font-bold text-lg text-text-dark dark:text-amber-100">
                                 {product.quantity} {product.unit}
                              </span>
                           </div>
                           {product.expiry_date && (
                              <div className="text-xs text-right text-text-dark/40 dark:text-amber-200/40">
                                 Exp: {new Date(product.expiry_date).toLocaleDateString()}
                              </div>
                           )}
                        </div>
                     </GlassCard>
                  ))}
               </div>
             ) : (
                <p className="text-sm text-text-dark/40 dark:text-amber-200/40 italic pl-2">Brak produktów gotowych.</p>
             )}
          </section>

          {/* Section C: Spare Hives */}
          <section>
             <div className="flex items-center gap-2 mb-4">
                <Archive className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold text-text-dark dark:text-amber-50">Wolne Ule (Magazyn)</h2>
             </div>
             {storedHives.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                   {storedHives.map((hive) => (
                      <GlassCard key={hive.id} className="p-3 flex flex-col items-center text-center opacity-80 hover:opacity-100 transition-opacity">
                         <div className="text-2xl mb-2 grayscale opacity-70">🐝</div>
                         <h3 className="font-bold text-text-dark dark:text-amber-100 text-md">{hive.hive_number}</h3>
                         <span className="text-[10px] text-text-dark/50 dark:text-amber-200/50 uppercase mt-1">{hive.type}</span>
                         <span className="text-[10px] text-primary mt-2 border border-primary/30 px-2 py-0.5 rounded-full">
                            Nieprzypisany
                         </span>
                      </GlassCard>
                   ))}
                </div>
             ) : (
                <p className="text-sm text-text-dark/40 dark:text-amber-200/40 italic pl-2">Brak wolnych uli. Wszystkie są przypisane do pasiek.</p>
             )}
          </section>

        </div>
      )}
    </div>
  );
}

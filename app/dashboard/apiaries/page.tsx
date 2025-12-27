import { getUserApiaries } from '@/app/actions/get-apiaries';
import { getSessionUid } from '@/app/actions/auth-session';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function ApiariesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: apiaries, error } = await getUserApiaries();

  if (error) {
    console.error("Apiaries fetch error:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         {/* H1 matches Sidebar Label "Pasieki" */}
         <h1 className="text-3xl font-heading font-bold text-primary">Pasieki</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Błąd pobierania danych: {error}
        </div>
      )}

      {!error && apiaries.length === 0 ? (
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center">
           <div className="text-4xl mb-4">🍯</div>
           <h3 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-2">Nie znaleziono pasiek</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60">
             Dodaj je w aplikacji mobilnej, aby zarządzać nimi tutaj.
           </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiaries.map((apiary) => {
            const hivesCount = apiary.hives?.[0]?.count || 0;
            return (
            <GlassCard key={apiary.id} className="p-6 flex flex-col h-full hover:scale-[1.02] transition-transform">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-text-dark dark:text-amber-100 truncate pr-2" title={apiary.name}>
                  {apiary.name}
                </h2>
                <div className="text-xs font-bold bg-primary/20 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                  {hivesCount} {hivesCount === 1 ? 'Ul' : 'Uli'}
                </div>
              </div>
              
              <div className="flex-grow space-y-2 mb-6">
                 {apiary.description && (
                   <p className="text-sm text-text-dark/80 dark:text-amber-200/80 line-clamp-2">
                     {apiary.description}
                   </p>
                 )}
                 {apiary.location && (
                   <div className="text-xs text-text-dark/60 dark:text-amber-200/60 flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">{apiary.location}</span>
                   </div>
                 )}
              </div>

              <div className="mt-auto pt-4 border-t border-glass-light dark:border-glass-dark">
                <Link 
                  href={`/dashboard/apiaries/${apiary.id}`}
                  className="block w-full text-center bg-primary/10 hover:bg-primary/20 text-primary font-bold py-2 rounded transition-colors text-sm uppercase"
                >
                  Zobacz ule
                </Link>
              </div>
            </GlassCard>
          )})}
        </div>
      )}
    </div>
  );
}

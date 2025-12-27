import { getUserHives } from '@/app/actions/get-hives';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function HivesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: hives, error } = await getUserHives();

  if (error) {
     console.error("Hives fetch error:", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-heading font-bold text-primary">Ule</h1>
      </div>

      <GlassCard className="p-4 mb-6">
         <p className="text-sm text-text-dark/60 dark:text-amber-200/60">
            Tutaj znajduje się lista wszystkich Twoich uli.
         </p>
      </GlassCard>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Błąd pobierania danych: {error}
        </div>
      )}

      {!error && hives.length === 0 ? (
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center">
           <div className="text-4xl mb-4">📦</div>
           <h3 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-2">Brak uli</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60">
             Nie znaleziono uli. Dodaj je w aplikacji mobilnej.
           </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {hives.map((hive) => (
            <GlassCard key={hive.id} className="p-4 flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
              <div className="text-2xl mb-2">🐝</div>
              {/* Correctly bind hive_number */}
              <h3 className="font-bold text-text-dark dark:text-amber-100 text-lg">{hive.hive_number}</h3>
              {hive.apiary && (
                 <div className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1 mb-1 font-medium bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded">
                    {hive.apiary.name}
                 </div>
              )}
              <span className="text-xs text-primary uppercase tracking-wider mt-1">{hive.type}</span>
              {hive.status && <p className="text-xs text-text-dark/50 dark:text-amber-200/50 mt-2 line-clamp-2">Status: {hive.status}</p>}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

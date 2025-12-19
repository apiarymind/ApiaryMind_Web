import { getUserHives } from '@/app/actions/get-hives';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function WarehousePage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const hives = await getUserHives(uid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         {/* H1 matches Sidebar Label "Magazyn" */}
         <h1 className="text-3xl font-heading font-bold text-primary">Magazyn</h1>
      </div>

      <GlassCard className="p-4 mb-6">
         <p className="text-sm text-text-dark/60 dark:text-amber-200/60">
            Tutaj znajduje się lista wszystkich Twoich uli (również tych nieprzypisanych).
         </p>
      </GlassCard>

      {hives.length === 0 ? (
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center">
           <div className="text-4xl mb-4">📦</div>
           <h3 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-2">Pusty magazyn</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60">
             Nie znaleziono sprzętu ani uli.
           </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {hives.map((hive) => (
            <GlassCard key={hive.id} className="p-4 flex flex-col items-center text-center hover:scale-[1.02] transition-transform">
              <div className="text-2xl mb-2">🐝</div>
              <h3 className="font-bold text-text-dark dark:text-amber-100 text-lg">{hive.name}</h3>
              <span className="text-xs text-primary uppercase tracking-wider mt-1">{hive.type}</span>
              {/* hive.description does not exist on type Hive currently, removing it to fix build */}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

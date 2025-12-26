import { getUserInspections } from '@/app/actions/get-inspections';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function InspectionsPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const inspections = await getUserInspections(uid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         {/* H1 matches Sidebar Label "Przeglądy" */}
         <h1 className="text-3xl font-heading font-bold text-primary">Przeglądy</h1>
      </div>

      {inspections.length === 0 ? (
        <GlassCard className="p-8 text-center flex flex-col items-center justify-center">
           <div className="text-4xl mb-4">📋</div>
           <h3 className="text-xl font-bold text-text-dark dark:text-amber-100 mb-2">Brak przeglądów</h3>
           <p className="text-text-dark/60 dark:text-amber-200/60">
             Wykonaj je w aplikacji mobilnej, aby zobaczyć historię tutaj.
           </p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => (
            <GlassCard key={insp.id} className="p-4 hover:scale-[1.01] transition-transform">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                <div className="text-lg font-bold text-text-dark dark:text-amber-100">
                   {insp.mood === 'AGGRESSIVE' ? 'Agresywne' : insp.mood === 'CALM' ? 'Spokojne' : 'Standardowy'}
                </div>
                <div className="text-xs text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 w-fit">
                   📅 {new Date(insp.date).toLocaleDateString()}
                </div>
              </div>
              {insp.notes && (
                <p className="text-sm text-text-dark/80 dark:text-amber-200/80 mt-2 border-t border-glass-light dark:border-glass-dark pt-2">
                   {insp.notes}
                </p>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

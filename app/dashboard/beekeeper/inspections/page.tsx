import { getUserInspections } from '@/app/actions/get-inspections';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';

export default async function InspectionsPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: inspections, error } = await getUserInspections();

  if (error) {
    console.error('Error fetching inspections:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         {/* H1 matches Sidebar Label "Przeglądy" */}
         <h1 className="text-3xl font-bold text-amber-500">Przeglądy</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 text-red-400 border border-red-500/50 rounded-xl">
          Błąd pobierania danych: {error}
        </div>
      )}

      {!error && inspections.length === 0 ? (
        <div className="bg-brown-800/50 border border-brown-700 rounded-xl p-8 text-center">
           <div className="text-4xl mb-4">📋</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Brak przeglądów</h3>
           <p className="text-amber-200/60">
             Wykonaj je w aplikacji mobilnej, aby zobaczyć historię tutaj.
           </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inspections.map((insp) => (
            <div key={insp.id} className="bg-brown-800 p-4 rounded-xl border border-brown-700 hover:border-amber-500/30 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                <div>
                    <div className="text-lg font-bold text-amber-100">
                       {insp.colony_strength ? `Siła: ${insp.colony_strength}` : 'Przegląd'}
                    </div>
                    {/* Context Info: Hive and Apiary */}
                    {insp.hive && (
                        <div className="text-xs text-amber-200/60 mt-1 flex items-center gap-2">
                           <span className="font-bold bg-amber-900/50 px-1.5 py-0.5 rounded">Ul: {insp.hive.hive_number}</span>
                           {insp.hive.apiary && (
                               <span>| Pasieka: {insp.hive.apiary.name}</span>
                           )}
                        </div>
                    )}
                </div>
                <div className="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded border border-amber-500/10 w-fit whitespace-nowrap">
                   📅 {new Date(insp.inspection_date).toLocaleDateString()}
                </div>
              </div>
              {insp.notes && (
                <p className="text-sm text-amber-200/80 mt-2 border-t border-brown-700/50 pt-2">
                   {insp.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { getApiaryDetails } from '@/app/actions/get-apiary-details';
import { getSessionUid } from '@/app/actions/auth-session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ApiaryDetailsPage({ params }: { params: { id: string } }) {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { apiary, hives } = await getApiaryDetails(uid, params.id);

  if (!apiary) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/apiaries" className="text-amber-500 hover:text-amber-400 font-bold mb-4 inline-block">
            ← Wróć do Pasiek
        </Link>
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl">
           <h3 className="text-xl font-bold text-red-400">Pasieka nie znaleziona</h3>
           <p className="text-red-200/60 mt-2">Nie udało się załadować danych pasieki lub nie masz do niej dostępu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link href="/dashboard/apiaries" className="text-amber-500 hover:text-amber-400 font-bold w-fit text-sm">
            ← Wróć do Pasiek
        </Link>
        
        <div className="flex justify-between items-start">
             <div>
                <h1 className="text-3xl font-bold text-amber-500">{apiary.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    {apiary.location && (
                        <span className="text-sm text-amber-200/60 flex items-center gap-1">
                            📍 {apiary.location}
                        </span>
                    )}
                </div>
             </div>
        </div>
      </div>

      <div className="mt-8 border-t border-brown-700/50 pt-6">
         <h2 className="text-xl font-bold text-amber-100 mb-4">Ule w tej pasiece ({hives.length})</h2>
         
         {hives.length === 0 ? (
            <div className="bg-brown-800/30 border border-brown-700 rounded-xl p-8 text-center max-w-lg mx-auto">
               <div className="text-3xl mb-3">🕸️</div>
               <h3 className="text-lg font-bold text-amber-100 mb-1">Ta pasieka jest pusta</h3>
               <p className="text-amber-200/60 text-sm">
                 Dodaj do niej ule w aplikacji mobilnej.
               </p>
            </div>
         ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {hives.map((hive) => (
                  <div key={hive.id} className="bg-brown-800 p-4 rounded-xl border border-brown-700 hover:border-amber-500/30 transition-colors flex flex-col items-center text-center">
                    <div className="text-2xl mb-2">🐝</div>
                    <h3 className="font-bold text-amber-100 text-lg">{hive.hive_number}</h3>
                    <span className="text-xs text-amber-400 uppercase tracking-wider mt-1">{hive.type}</span>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}

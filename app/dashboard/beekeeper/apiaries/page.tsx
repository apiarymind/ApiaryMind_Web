import { getUserApiaries } from '@/app/actions/get-apiaries';
import { getSessionUid } from '@/app/actions/auth-session';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ApiariesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: apiaries, error } = await getUserApiaries();

  if (error) {
    console.error('Error loading apiaries:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         {/* H1 matches Sidebar Label "Pasieki" */}
         <h1 className="text-3xl font-bold text-amber-500">Pasieki</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 text-red-400 border border-red-500/50 rounded-xl">
          Błąd pobierania danych: {error}
        </div>
      )}

      {!error && apiaries.length === 0 ? (
        <div className="bg-brown-800/50 border border-brown-700 rounded-xl p-8 text-center">
           <div className="text-4xl mb-4">🍯</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Nie znaleziono pasiek</h3>
           <p className="text-amber-200/60">
             Dodaj je w aplikacji mobilnej, aby zarządzać nimi tutaj.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiaries.map((apiary) => {
            const hivesCount = apiary.hives?.[0]?.count || 0;
            return (
            <div key={apiary.id} className="bg-brown-800 p-6 rounded-xl border border-brown-700 shadow-lg hover:border-amber-500/30 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-amber-100 truncate pr-2" title={apiary.name}>
                  {apiary.name}
                </h2>
                <div className="text-xs font-bold bg-amber-900/50 text-amber-400 px-2 py-1 rounded-full whitespace-nowrap">
                  {hivesCount} {hivesCount === 1 ? 'Ul' : 'Uli'}
                </div>
              </div>
              
              <div className="flex-grow space-y-2 mb-6">
                 {apiary.description && (
                   <p className="text-sm text-amber-200/80 line-clamp-2">
                     {apiary.description}
                   </p>
                 )}
                 {apiary.location && (
                   <div className="text-xs text-amber-200/60 flex items-center gap-1">
                      <span>📍</span>
                      <span className="truncate">{apiary.location}</span>
                   </div>
                 )}
              </div>

              <div className="mt-auto pt-4 border-t border-brown-700/50">
                <Link 
                  href={`/dashboard/apiaries/${apiary.id}`}
                  className="block w-full text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold py-2 rounded transition-colors text-sm uppercase"
                >
                  Zobacz ule
                </Link>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}

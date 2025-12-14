import { getUserHives } from '@/app/actions/get-hives';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';

export default async function HivesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const hives = await getUserHives(uid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <h1 className="text-3xl font-bold text-amber-500">Ule</h1>
      </div>

      <div className="bg-brown-800/30 p-4 rounded-xl border border-brown-700/50 mb-6">
         <p className="text-sm text-amber-200/60">
            Tutaj znajduje się lista wszystkich Twoich uli.
         </p>
      </div>

      {hives.length === 0 ? (
        <div className="bg-brown-800/50 border border-brown-700 rounded-xl p-8 text-center">
           <div className="text-4xl mb-4">📦</div>
           <h3 className="text-xl font-bold text-amber-100 mb-2">Brak uli</h3>
           <p className="text-amber-200/60">
             Nie znaleziono uli. Dodaj je w aplikacji mobilnej.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {hives.map((hive) => (
            <div key={hive.id} className="bg-brown-800 p-4 rounded-xl border border-brown-700 hover:border-amber-500/30 transition-colors flex flex-col items-center text-center">
              <div className="text-2xl mb-2">🐝</div>
              <h3 className="font-bold text-amber-100 text-lg">{hive.name}</h3>
              <span className="text-xs text-amber-400 uppercase tracking-wider mt-1">{hive.type}</span>
              {hive.status && <p className="text-xs text-amber-200/50 mt-2 line-clamp-2">Status: {hive.status}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

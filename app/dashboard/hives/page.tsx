import { getUserHives } from '@/app/actions/get-hives';
import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import HivesBrowser from './HivesBrowser';

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
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-heading font-bold text-yellow-500">Przeglądarka Uli</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Błąd pobierania danych: {error}
        </div>
      )}

      {!error && hives.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center bg-neutral-900 border border-neutral-800 rounded-xl">
           <div className="text-4xl mb-4">📦</div>
           <h3 className="text-xl font-bold text-white mb-2">Brak uli</h3>
           <p className="text-neutral-400">
             Nie znaleziono uli. Dodaj je w aplikacji mobilnej.
           </p>
        </div>
      ) : (
        <HivesBrowser initialHives={hives} />
      )}
    </div>
  );
}

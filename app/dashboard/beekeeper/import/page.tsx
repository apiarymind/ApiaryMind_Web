import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { ImportDataClient } from './ImportDataClient';

export default async function ImportDataPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Import Danych</h1>
          <p className="text-sm text-text-dark/60 dark:text-gray-400 mt-2">
            Zaimportuj dane z plików CSV lub Excel do swojej pasieki
          </p>
        </div>
      </div>

      <ImportDataClient />
    </div>
  );
}






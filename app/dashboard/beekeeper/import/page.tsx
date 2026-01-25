import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import UniversalImport from '@/components/import/UniversalImport';

export default async function ImportDataPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-amber-100">Import Danych</h1>
          <p className="text-sm text-gray-700 dark:text-white/60 mt-2">
            Inteligentny import z AI – wrzuć dowolny plik Excel/CSV, a system automatycznie rozpozna i zmapuje dane
          </p>
        </div>
      </div>

      <UniversalImport />
    </div>
  );
}











import { getHiveDetails } from '@/app/actions/get-hive-details';
import { getHiveInspections } from '@/app/actions/get-inspections';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HiveDetailsTabs from '@/app/components/HiveDetailsTabs';

export default async function HiveDetailsPage({ params }: { params: { id: string; hiveId: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }

  // Parallel data fetching for efficiency
  // 1. Full Hive Details (Metadata + Queen + Latest Inspection)
  // 2. All Inspections (For timeline)
  const [hiveDetailsRes, inspections] = await Promise.all([
    getHiveDetails(params.hiveId),
    getHiveInspections(params.hiveId)
  ]);

  const hive = hiveDetailsRes.data;

  if (!hive) {
     return (
        <div className="p-8 text-center text-red-400">
           Nie znaleziono ula.
        </div>
     );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
       {/* Breadcrumbs / Header */}
       <div className="flex flex-col gap-2">
          <Link href={`/dashboard/apiaries/${params.id}`} className="text-sm text-yellow-600 hover:text-yellow-500 font-bold transition-colors">
             ← Wróć do Pasieki
          </Link>
          <div className="flex justify-between items-start">
             <div>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    Ul {hive.hive_number}
                 </h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Historia przeglądów i stan rodziny.
                 </p>
             </div>
             
             <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all">
                Dodaj Przegląd
             </button>
          </div>
       </div>

       {/* Client Component handling Tabs */}
       <HiveDetailsTabs hive={hive} inspections={inspections} />
    </div>
  );
}

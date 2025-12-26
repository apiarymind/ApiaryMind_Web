import { Inspection } from '@/types/supabase';
import { InspectionTimeline } from '@/components/InspectionTimeline';
import { getHiveInspections } from '@/app/actions/get-inspections';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function HiveDetailsPage({ params }: { params: { id: string; hiveId: string } }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch Inspections
  const inspections = await getHiveInspections(params.hiveId);

  // Fetch Hive Name (Optional but good for UI)
  const { data: hive } = await supabase
    .from('hives')
    .select('name, status')
    .eq('id', params.hiveId)
    .single();

  const hiveName = hive?.name || `#${params.hiveId}`;
  const hiveStatus = hive?.status || 'UNKNOWN';

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
                    Ul {hiveName}
                    <span className={`text-sm px-2 py-1 rounded font-bold uppercase tracking-wider ${hiveStatus === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700'}`}>
                       {hiveStatus}
                    </span>
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

       {/* Tabs placeholder */}
       <div className="border-b border-gray-200 dark:border-gray-700 flex gap-6">
          <button className="py-3 border-b-2 border-yellow-500 text-yellow-600 dark:text-yellow-500 font-bold">
             Historia Przeglądów
          </button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium">
             Dane Rodziny
          </button>
          <button className="py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium">
             Matka Pszczela
          </button>
       </div>

       {/* Timeline Content */}
       <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
          <InspectionTimeline inspections={inspections} />
       </div>
    </div>
  );
}

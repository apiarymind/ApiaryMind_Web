import { getHiveDetails } from '@/app/actions/get-hive-details';
import { getHiveInspections } from '@/app/actions/get-inspections';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HiveDetailsTabs from '@/app/components/HiveDetailsTabs';
import AddInspectionButton from '@/app/components/AddInspectionButton';
import AddHarvestButton from '@/app/components/AddHarvestButton';
import RemovalAlert from '@/app/components/veterinary/RemovalAlert';
import VeterinaryStatusBadge from '@/app/components/veterinary/VeterinaryStatusBadge';
import { getHivesActiveStatus } from '@/app/actions/get-active-hives';

export default async function HiveDetailsPage({ params }: { params: { id: string; hiveId: string } }) {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }

  console.log('[HiveDetailsPage] Params:', params);

  // Parallel data fetching for efficiency
  // 1. Full Hive Details (Metadata + Queen + Latest Inspection)
  // 2. All Inspections (For timeline)
  // 3. Check if hive is suspended
  const [hiveDetailsRes, inspections, hiveStatus] = await Promise.all([
    getHiveDetails(params.hiveId),
    getHiveInspections(params.hiveId),
    getHivesActiveStatus(user.id)
  ]);

  const hive = hiveDetailsRes.data;

  if (!hive) {
     console.error('[HiveDetailsPage] Hive not found. Error:', hiveDetailsRes.error);
     return (
        <div className="p-8 text-center text-red-400">
           Nie znaleziono ula. (ID: {params.hiveId})
           <br/>
           <span className="text-sm text-gray-500">Error: {hiveDetailsRes.error}</span>
        </div>
     );
  }

  // Check if hive is suspended
  const isSuspended = hiveStatus.suspendedHives.includes(params.hiveId);

  // If hive is suspended, show blocked access message
  if (isSuspended) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <Link href={`/dashboard/apiaries/${params.id}`} className="text-sm text-yellow-600 hover:text-yellow-500 font-bold transition-colors">
             ← Wróć do Pasieki
          </Link>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-400 mb-2">Ul {hive.hive_number} jest zawieszony</h1>
          <p className="text-gray-500 mb-4">
            Ten ul jest poza limitem Twojego planu. Nie możesz dodawać przeglądów ani zarządzać tym ulem.
          </p>
          <p className="text-amber-500 font-semibold">
            Podnieś plan na wyższy aby odblokować dostęp do wszystkich uli.
          </p>
        </div>
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
             <div>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    Ul {hive.hive_number}
                 </h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Historia przeglądów i stan rodziny.
                 </p>
             </div>
             <div className="flex flex-wrap gap-3">
               <AddInspectionButton hiveId={hive.id} hiveName={hive.hive_number} />
               <AddHarvestButton
                 hiveId={hive.id}
                 isDisabled={!((hive.latest_inspection?.honey_supers_count ?? 0) > 0)}
                 disabledReason="Dodaj miodnię w konfiguracji ula, aby zapisać zbiór."
               />
             </div>
          </div>
       </div>

       {/* Critical Removal Alerts - Show prominently at top */}
       {hive.active_treatments && hive.active_treatments
         .filter((t: any) => {
           if (!t.removal_date || t.is_removed) return false;
           const removalDate = new Date(t.removal_date);
           return removalDate <= new Date();
         })
         .map((treatment: any) => (
           <RemovalAlert
             key={treatment.id}
             treatment={treatment}
             hiveNumber={hive.hive_number}
           />
         ))}

       {/* Veterinary Status Badge */}
       {hive.active_treatments && hive.active_treatments.length > 0 && (
         <VeterinaryStatusBadge activeTreatments={hive.active_treatments as any} />
       )}

       {/* Client Component handling Tabs */}
       <HiveDetailsTabs hive={hive} inspections={inspections} />
    </div>
  );
}

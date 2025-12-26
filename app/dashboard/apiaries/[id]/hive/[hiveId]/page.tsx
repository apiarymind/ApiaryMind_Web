import { Inspection } from '@/types/supabase';
import { InspectionTimeline } from '@/components/InspectionTimeline';
import Link from 'next/link';

// Mock data
const MOCK_INSPECTIONS: Inspection[] = [
  {
    id: '1',
    hive_id: 'h1',
    performed_by_id: 'u1',
    date: '2024-05-20',
    mood: 'CALM',
    notes: 'Matka czerwi prawidłowo. Dużo zapasów. Pszczoły spokojne.',
    batch_id: 'b1', // Breeding Batch linked
    created_at: '2024-05-20',
    performed_by: {
        id: 'u1',
        email: 'szef@pasieka.pl',
        full_name: 'Janusz Truteń',
        subscription_plan: 'BUSINESS',
        eyescoin_balance: 0,
        created_at: '',
        updated_at: ''
    }
  },
  {
    id: '2',
    hive_id: 'h1',
    performed_by_id: 'u2',
    date: '2024-05-10',
    mood: 'AGGRESSIVE',
    notes: 'Agresywne zachowanie przy wylotku. Sprawdzić nastroje przy kolejnym przeglądzie.',
    created_at: '2024-05-10',
    performed_by: {
        id: 'u2',
        email: 'pracownik@pasieka.pl',
        full_name: 'Michał Pszczoła',
        subscription_plan: 'FREE',
        eyescoin_balance: 0,
        created_at: '',
        updated_at: ''
    }
  },
  {
    id: '3',
    hive_id: 'h1',
    performed_by_id: 'u1',
    date: '2024-04-25',
    mood: 'NORMAL',
    notes: 'Przegląd wiosenny. Poszerzono gniazdo.',
    created_at: '2024-04-25',
    performed_by: {
        id: 'u1',
        email: 'szef@pasieka.pl',
        full_name: 'Janusz Truteń',
        subscription_plan: 'BUSINESS',
        eyescoin_balance: 0,
        created_at: '',
        updated_at: ''
    }
  }
];

export default function HiveDetailsPage({ params }: { params: { id: string; hiveId: string } }) {
  // TODO: Fetch actual hive data and inspections

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
                    Ul #0{params.hiveId}
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded font-bold uppercase tracking-wider">
                       Aktywny
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
          <InspectionTimeline inspections={MOCK_INSPECTIONS} />
       </div>
    </div>
  );
}

import { getApiaryOperationalData } from '@/app/actions/get-apiary-operational';
import { getSessionUid } from '@/app/actions/auth-session';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MapPanel } from '@/app/components/operational/MapPanel';
import { WeatherPanel } from '@/app/components/operational/WeatherPanel';
import { TasksPanel } from '@/app/components/operational/TasksPanel';
import { QuarantinePanel } from '@/app/components/operational/QuarantinePanel';
import ApiaryTreatmentsExport from '@/app/components/veterinary/ApiaryTreatmentsExport';
import AddHiveModalClient from '@/app/components/apiaries/AddHiveModalClient';

export default async function ApiaryOperationalDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data, error } = await getApiaryOperationalData(uid, params.id);

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Link
            href="/dashboard/apiaries"
            className="text-amber-500 hover:text-amber-400 font-bold mb-4 inline-block"
          >
            ← Wróć do Pasiek
          </Link>
          <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-red-400">Błąd</h3>
            <p className="text-red-200/60 mt-2">
              {error || 'Nie udało się załadować danych operacyjnych pasieki.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isMigratory = (data.apiary.type || '').toLowerCase() === 'migratory';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Link
            href="/dashboard/apiaries"
            className="text-amber-500 hover:text-amber-400 font-bold w-fit text-sm"
          >
            ← Wróć do Pasiek
          </Link>

          <div className="flex flex-row justify-between items-start w-full mb-6">
            {/* Lewa strona - Tytuły */}
            <div>
              <h1 className="text-4xl font-bold text-amber-500 mb-2">
                Dashboard Operacyjny
              </h1>
              <h2 className="text-2xl font-semibold text-amber-200/80">
                {data.apiary.name}
              </h2>
            </div>

            {/* Prawa strona - PRZYCISK */}
            <div className="flex gap-2">
              <AddHiveModalClient apiaryId={params.id} />
            </div>
          </div>
        </div>

        {isMigratory && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
              <h3 className="text-sm font-bold text-amber-300 mb-2">Kafelek Weterynaryjny</h3>
              <p className="text-sm text-white/70">
                Wymóg posiadania Świadectwa Zdrowia Pszczół oraz numeru WNI.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
              <h3 className="text-sm font-bold text-amber-300 mb-2">Kafelek Prawo Leśne</h3>
              <p className="text-sm text-white/70">
                Umowy na postój na gruntach Lasów Państwowych/cudzych oraz obowiązek oznakowania terenu.
              </p>
            </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
                <h3 className="text-sm font-bold text-amber-300 mb-2">Kodeks Cywilny i Bezpieczeństwo</h3>
                <p className="text-sm text-white/70">
                  Odpowiedzialność za szkody (Art. 431 KC), wymóg tablic ostrzegawczych oraz zgoda właściciela gruntu (Art. 140 KC).
                </p>
              </div>
          </div>
        )}

        {/* 4 Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel A: Mapa */}
          <div className="lg:col-span-1">
            <MapPanel locationGeo={data.apiary.location_geo} />
          </div>

          {/* Panel B: Pogoda */}
          <div className="lg:col-span-1">
            <WeatherPanel locationGeo={data.apiary.location_geo} />
          </div>

          {/* Panel C: Tablica Zadań */}
          <div className="lg:col-span-1">
            <TasksPanel tasks={data.tasks} apiaryId={params.id} />
          </div>

          {/* Panel D: Status Bezpieczeństwa */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <QuarantinePanel
                isActive={data.quarantineStatus.isActive}
                endDate={data.quarantineStatus.endDate}
              />
              {/* Export Treatments Button */}
              <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white/80 mb-1">
                      Eksport Leczeń
                    </h4>
                    <p className="text-xs text-white/50">
                      Pobierz historię leczeń dla całej pasieki
                    </p>
                  </div>
                  <ApiaryTreatmentsExport
                    apiaryId={params.id}
                    apiaryName={data.apiary.name}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



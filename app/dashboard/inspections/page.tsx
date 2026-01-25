import { getSessionUid } from '@/app/actions/auth-session';
import { redirect } from 'next/navigation';
import { getWeeklyInspections } from '@/app/actions/get-weekly-inspections';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import WeeklyInspectionsClient from '@/app/components/inspections/WeeklyInspectionsClient';

export default async function InspectionsPage({
  searchParams
}: {
  searchParams: { week?: string; year?: string; apiary?: string }
}) {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  // Get current week or use searchParams
  const today = new Date();
  const year = searchParams.year ? parseInt(searchParams.year) : getISOWeekYear(today);
  const week = searchParams.week ? parseInt(searchParams.week) : getISOWeek(today);
  const apiaryId = searchParams.apiary || undefined;

  const { data, error } = await getWeeklyInspections(year, week, apiaryId);

  if (error) {
    console.error("Weekly inspections fetch error:", error);
  }

  const initialData = data || {
    hives: [],
    inspections: [],
    pendingHives: [],
    completedHives: []
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-primary">Przeglądy</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
          Błąd pobierania danych: {error}
        </div>
      )}

      <WeeklyInspectionsClient
        initialData={initialData}
        initialYear={year}
        initialWeek={week}
        initialApiaryId={apiaryId}
      />
    </div>
  );
}

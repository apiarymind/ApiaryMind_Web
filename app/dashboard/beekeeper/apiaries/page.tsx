import { getUserApiaries } from '@/app/actions/get-apiaries';
import { getSessionUid } from '@/app/actions/auth-session';
import { getApiariesStatus } from '@/app/actions/get-apiary-status';
import { redirect } from 'next/navigation';
import { ApiariesListClient } from '@/app/components/apiaries/ApiariesListClient';

export default async function ApiariesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: apiaries, error } = await getUserApiaries();

  if (error) {
    console.error('Error loading apiaries:', error);
  }

  // Pobierz status dla wszystkich pasiek
  const apiaryIds = apiaries.map((a) => a.id);
  const { data: statuses } = await getApiariesStatus(apiaryIds);
  const statusMap = new Map(statuses.map((s) => [s.apiaryId, s]));

  return (
    <ApiariesListClient
      apiaries={apiaries}
      statusMap={statusMap}
      error={error}
    />
  );
}

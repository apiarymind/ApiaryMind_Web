import { getUserApiaries } from '@/app/actions/get-apiaries';
import { getSessionUid } from '@/app/actions/auth-session';
import { getApiariesStatus } from '@/app/actions/get-apiary-status';
import { redirect } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { ApiariesListClient } from '@/app/components/apiaries/ApiariesListClient';
import OnboardingFooter from '@/app/components/onboarding/OnboardingFooter';

export default async function ApiariesPage() {
  const uid = await getSessionUid();
  if (!uid) {
    redirect('/login');
  }

  const { data: apiaries, error } = await getUserApiaries();

  if (error) {
    console.error("Apiaries fetch error:", error);
  }

  // Pobierz status dla wszystkich pasiek
  const apiaryIds = apiaries.map((a) => a.id);
  const { data: statuses } = await getApiariesStatus(apiaryIds);
  const statusMap = new Map(statuses.map((s) => [s.apiaryId, s]));

  return (
    <>
      <ApiariesListClient
        apiaries={apiaries}
        statusMap={statusMap}
        error={error}
      />
      
      {/* Onboarding Footer - Krok 2 */}
      <OnboardingFooter
        step={2}
        count={apiaries?.length || 0}
        iconName="MapPin"
        infoText="Dodaj pasiekę i podaj współrzędne GPS. Dzięki temu system automatycznie pobierze dane pogodowe, kluczowe przy planowaniu przeglądów."
        buttonLabel="Pasieki gotowe, idź do Uli >>"
      />
    </>
  );
}

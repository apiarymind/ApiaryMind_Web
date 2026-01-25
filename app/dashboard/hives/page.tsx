import { getUserHives } from '@/app/actions/get-hives';
import { Apiary } from '@/app/actions/get-apiaries';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HivesBrowser from './HivesBrowser';
import OnboardingFooter from '@/app/components/onboarding/OnboardingFooter';

export default async function HivesPage() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  const [{ data: hives, error }, { data: userApiaries, error: apiariesError }] = await Promise.all([
    getUserHives(),
    supabase
      .from('apiaries')
      .select('id, name, type')
      .eq('owner_id', user.id)
      .order('name')
  ]);

  if (error) {
     console.error("Hives fetch error:", error);
  }
  if (apiariesError) {
    console.error("Apiaries fetch error:", apiariesError);
  }

  const normalizedApiaries: Apiary[] = (userApiaries || []).map((apiary) => ({
    id: apiary.id,
    name: apiary.name,
    type: apiary.type ?? null,
    location: null
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-heading font-bold text-yellow-500">Przeglądarka Uli</h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-500 text-sm mb-4">
           Błąd pobierania danych: {error}
        </div>
      )}

      {!error && (
        <HivesBrowser initialHives={hives} initialApiaries={normalizedApiaries} />
      )}

      {/* Onboarding Footer - Krok 3 */}
      <OnboardingFooter
        step={3}
        count={hives?.length || 0}
        iconName="Home"
        infoText="To serce Twojej gospodarki. Dodaj ule, wybierając je z Magazynu i zasiedl pierwsze rodziny."
        buttonLabel="Ule stoją, idź do Ustawień >>"
      />
    </div>
  );
}

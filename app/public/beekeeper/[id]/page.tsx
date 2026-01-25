import ApiaryMindLogo from '@/components/ApiaryMindLogo';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { getBeekeeperPublicProfile } from '@/app/actions/get-beekeeper-public';

function formatDate(value: string | null) {
  if (!value) return 'Brak danych';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('pl-PL');
}

export default async function PublicBeekeeperCardPage({
  params,
}: {
  params: { id: string };
}) {
  const { data, error } = await getBeekeeperPublicProfile(params.id);

  if (error || !data) {
    return (
      <div className="min-h-screen bg-transparent text-text-dark dark:text-amber-50 p-6 flex items-center justify-center">
        <GlassCard className="w-full max-w-lg text-center">
          <ApiaryMindLogo className="justify-center mb-4" />
          <h1 className="text-2xl font-bold mb-2">Publiczna wizytówka pszczelarza</h1>
          <p className="text-text-dark/70 dark:text-amber-200/70 text-sm">Nie udało się załadować danych.</p>
        </GlassCard>
      </div>
    );
  }

  if (!data.is_public_profile_enabled) {
    return (
      <div className="min-h-screen bg-transparent text-text-dark dark:text-amber-50 p-6 flex items-center justify-center">
        <GlassCard className="w-full max-w-lg text-center">
          <ApiaryMindLogo className="justify-center mb-4" />
          <h1 className="text-2xl font-bold">Publiczna wizytówka pszczelarza</h1>
          <p className="text-text-dark/70 dark:text-amber-200/70 text-sm">
            Wizytówka jest nieaktywna.
          </p>
        </GlassCard>
      </div>
    );
  }

  const ownerName = [data.first_name, data.last_name].filter(Boolean).join(' ');
  const authorityCity = data.default_vet_authority?.trim() || '';
  const authorityDisplay = authorityCity
    ? `Powiatowy Lekarz Weterynarii w: ${authorityCity}`
    : 'Brak danych';
  const showAddress = Boolean(data.public_profile_config?.show_address);
  const showCompany = Boolean(data.public_profile_config?.show_company);
  const addressParts = [data.street_address, data.postal_code, data.city].filter(
    (part) => part && part.trim() !== ''
  );

  return (
    <div className="min-h-screen bg-transparent text-text-dark dark:text-amber-50 p-6 flex items-center justify-center">
      <GlassCard className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <ApiaryMindLogo className="justify-center" />
          <div>
            <h1 className="text-2xl font-bold">Publiczna wizytówka pszczelarza</h1>
            <p className="text-text-dark/70 dark:text-amber-200/70 text-sm">
              Dane kontaktowe oraz informacje weterynaryjne.
            </p>
          </div>
        </div>

        <div>
          <div className="pb-4 space-y-2 text-sm">
            <h2 className="text-base font-semibold">Pszczelarz</h2>
            <div>
              <span className="text-text-dark/60 dark:text-amber-200/60">Pszczelarz:</span>{' '}
              <span className="font-semibold">{ownerName || 'Brak danych'}</span>
            </div>
            <div>
              <span className="text-text-dark/60 dark:text-amber-200/60">Telefon:</span>{' '}
              <span className="font-semibold">{data.phone_number || 'Brak danych'}</span>
            </div>
            {showCompany && (
              <div>
                <span className="text-text-dark/60 dark:text-amber-200/60">Firma:</span>{' '}
                <span className="font-semibold">{data.company_name || 'Brak danych'}</span>
              </div>
            )}
            {showAddress && (
              <div>
                <span className="text-text-dark/60 dark:text-amber-200/60">Adres:</span>{' '}
                <span className="font-semibold">{addressParts.join(', ') || 'Brak danych'}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-glass-light dark:border-glass-dark">
            <div className="rounded-xl border border-glass-light dark:border-glass-dark bg-white/60 dark:bg-black/30 p-4 space-y-2 text-sm">
              <h2 className="text-base font-semibold">Świadectwo zdrowia pszczół</h2>
              <div>
                <span className="text-text-dark/60 dark:text-amber-200/60">Numer Świadectwa:</span>{' '}
                <span className="font-semibold">{data.health_cert_number || 'Brak danych'}</span>
              </div>
              <div>
                <span className="text-text-dark/60 dark:text-amber-200/60">Data ważności:</span>{' '}
                <span className="font-semibold">{formatDate(data.health_cert_date)}</span>
              </div>
              <div>
                <span className="text-text-dark/60 dark:text-amber-200/60">Organ wydający:</span>{' '}
                <span className="font-semibold">{authorityDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-text-dark/60 dark:text-amber-200/60 text-center">
          Dane służą do weryfikacji telefonicznej dokumentów przez służby (Policja/Weterynaria).
        </p>
      </GlassCard>
    </div>
  );
}

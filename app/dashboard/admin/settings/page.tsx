import { getGlobalSettings } from '@/app/actions/admin/get-global-settings';
import SettingsList from './SettingsList';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function AdminSettingsPage() {
  const settings = await getGlobalSettings();

  return (
    <div>
      <h1 className="text-3xl font-heading font-bold text-primary mb-6">Konfiguracja Systemu</h1>
      
      <GlassCard className="p-6">
         <p className="text-text-dark/60 dark:text-amber-200/60 mb-6 text-sm">
           Poniżej znajdują się globalne flagi systemowe. Zmiany są natychmiastowe i wpływają na wszystkich użytkowników.
         </p>
         
         <SettingsList settings={settings} />
      </GlassCard>
    </div>
  );
}

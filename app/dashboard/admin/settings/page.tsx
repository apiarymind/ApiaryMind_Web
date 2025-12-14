import { getGlobalSettings } from '@/app/actions/admin/get-global-settings';
import SettingsList from './SettingsList';

export default async function AdminSettingsPage() {
  const settings = await getGlobalSettings();

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Konfiguracja Systemu</h1>
      
      <div className="bg-brown-900/50 border border-brown-700 rounded-xl p-6">
         <p className="text-amber-200/60 mb-6 text-sm">
           Poniżej znajdują się globalne flagi systemowe. Zmiany są natychmiastowe i wpływają na wszystkich użytkowników.
         </p>
         
         <SettingsList settings={settings} />
      </div>
    </div>
  );
}
